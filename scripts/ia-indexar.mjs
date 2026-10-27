/**
 * Arma la base de conocimiento de la IA a partir de ia-documentos/:
 * extrae el texto de cada documento por pagina, lo divide en fragmentos y
 * calcula sus embeddings con Mistral. Resultado: ia-documentos/indice.json.
 *
 * Uso: npm run ia:indexar  (lee MISTRAL_API_KEY de .env.local o .env.<NODE_ENV>).
 * Volver a correrlo cada vez que se agregue, cambie o quite un documento.
 */
import { config } from 'dotenv';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { extractText, getDocumentProxy } from 'unpdf';

const CARPETA = 'ia-documentos';
const SALIDA = join(CARPETA, 'indice.json');
const MODELO = 'mistral-embed';
const TAMANO = 1200;
const SOLAPAMIENTO = 200;
const LOTE = 32;
// El plan gratuito admite alrededor de un pedido por segundo.
const PAUSA_MS = 1200;

config({ path: `.env.${process.env.NODE_ENV || 'local'}`, quiet: true });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Texto de cada pagina (los .txt y .md cuentan como una sola pagina). */
async function paginas(ruta) {
  if (extname(ruta).toLowerCase() !== '.pdf') {
    return [readFileSync(ruta, 'utf-8')];
  }
  const pdf = await getDocumentProxy(new Uint8Array(readFileSync(ruta)));
  const { text } = await extractText(pdf, { mergePages: false });
  return text;
}

/** Divide el texto en pedazos de ~TAMANO caracteres que se solapan un poco. */
function dividir(texto) {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  const pedazos = [];
  for (let inicio = 0; inicio < limpio.length; ) {
    let fin = Math.min(inicio + TAMANO, limpio.length);
    if (fin < limpio.length) {
      const corte = limpio.lastIndexOf(' ', fin);
      if (corte > inicio + TAMANO / 2) fin = corte;
    }
    pedazos.push(limpio.slice(inicio, fin));
    if (fin >= limpio.length) break;
    inicio = fin - SOLAPAMIENTO;
  }
  // Paginas casi vacias (portadas, indices) no aportan a la busqueda.
  return pedazos.filter((p) => p.length >= 80);
}

async function embeber(apiKey, textos, reintento = true) {
  const respuesta = await fetch('https://api.mistral.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODELO, input: textos }),
  });
  if (respuesta.status === 429 && reintento) {
    await esperar(5000);
    return embeber(apiKey, textos, false);
  }
  if (!respuesta.ok) {
    throw new Error(
      `Mistral respondio ${respuesta.status}: ${(await respuesta.text()).slice(0, 300)}`,
    );
  }
  const { data } = await respuesta.json();
  return data.map((d) => d.embedding);
}

async function main() {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('Falta MISTRAL_API_KEY en el .env');

  const archivos = readdirSync(CARPETA).filter((f) =>
    /\.(pdf|txt|md)$/i.test(f),
  );
  if (archivos.length === 0) {
    throw new Error(`No hay documentos (.pdf, .txt, .md) en ${CARPETA}/`);
  }

  const fragmentos = [];
  for (const archivo of archivos) {
    const textos = await paginas(join(CARPETA, archivo));
    let cantidad = 0;
    textos.forEach((texto, i) => {
      for (const pedazo of dividir(texto)) {
        fragmentos.push({ archivo, pagina: i + 1, texto: pedazo });
        cantidad++;
      }
    });
    console.log(`- ${archivo}: ${textos.length} páginas, ${cantidad} fragmentos`);
  }

  console.log(`\nCalculando embeddings de ${fragmentos.length} fragmentos...`);
  for (let i = 0; i < fragmentos.length; i += LOTE) {
    const lote = fragmentos.slice(i, i + LOTE);
    const vectores = await embeber(
      apiKey,
      lote.map((f) => f.texto),
    );
    lote.forEach((f, j) => (f.vector = vectores[j]));
    console.log(`  ${Math.min(i + LOTE, fragmentos.length)}/${fragmentos.length}`);
    await esperar(PAUSA_MS);
  }

  const indice = {
    modeloEmbedding: MODELO,
    creado: new Date().toISOString(),
    fragmentos: fragmentos.map((f, i) => ({ id: String(i + 1), ...f })),
  };
  writeFileSync(SALIDA, JSON.stringify(indice));
  console.log(`\nListo: ${SALIDA}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
