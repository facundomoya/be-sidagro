/**
 * Sube los documentos de ia-documentos/ al File Search Store de Gemini.
 * Uso: npm run ia:indexar  (lee .env.local, o .env.<NODE_ENV>).
 *
 * - Sin GEMINI_FILE_SEARCH_STORE crea un store nuevo e imprime su nombre.
 * - Con GEMINI_FILE_SEARCH_STORE solo sube los archivos que aun no estan.
 */
import * as dotenv from 'dotenv';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';

const CARPETA = join(__dirname, '..', 'ia-documentos');
const EXTENSIONES = /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv|json|html?)$/i;
const ESPERA_MS = 5000;

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'local'}` });

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY en el .env');
  if (!existsSync(CARPETA)) throw new Error(`No existe la carpeta ${CARPETA}`);

  const archivos = readdirSync(CARPETA).filter((f) => EXTENSIONES.test(f));
  if (archivos.length === 0) {
    throw new Error(`No hay documentos para indexar en ${CARPETA}`);
  }

  const ai = new GoogleGenAI({ apiKey });

  let storeName = process.env.GEMINI_FILE_SEARCH_STORE;
  if (storeName) {
    await ai.fileSearchStores.get({ name: storeName });
    console.log(`Usando el store existente ${storeName}`);
  } else {
    const store = await ai.fileSearchStores.create({
      config: {
        displayName: 'sid-agro-documentos',
        embeddingModel: 'models/gemini-embedding-2',
      },
    });
    storeName = store.name!;
    console.log(`Store creado: ${storeName}`);
  }

  const yaSubidos = new Set<string>();
  const documentos = await ai.fileSearchStores.documents.list({
    parent: storeName,
  });
  for await (const doc of documentos) {
    if (doc.displayName) yaSubidos.add(doc.displayName);
  }

  for (const archivo of archivos) {
    if (yaSubidos.has(archivo)) {
      console.log(`- ${archivo}: ya estaba indexado, se omite`);
      continue;
    }
    console.log(`- ${archivo}: subiendo e indexando...`);
    let operacion = await ai.fileSearchStores.uploadToFileSearchStore({
      file: join(CARPETA, archivo),
      fileSearchStoreName: storeName,
      config: { displayName: archivo },
    });
    while (!operacion.done) {
      await esperar(ESPERA_MS);
      operacion = await ai.operations.get({ operation: operacion });
    }
    if (operacion.error) {
      throw new Error(
        `Fallo la indexacion de ${archivo}: ${JSON.stringify(operacion.error)}`,
      );
    }
    console.log(`  listo`);
  }

  console.log('\nIndexacion terminada. Copia esta linea en tu .env:');
  console.log(`GEMINI_FILE_SEARCH_STORE=${storeName}`);
}

main().catch((error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
