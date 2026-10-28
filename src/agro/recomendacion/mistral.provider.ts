import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseConocimiento, Fragmento } from './base-conocimiento';
import {
  ContextoEscenario,
  FuenteConsultada,
  RecomendacionGenerada,
  RecommendationProvider,
} from './recommendation-provider.interface';
import {
  ESQUEMA_RECOMENDACION,
  INSTRUCCIONES_SISTEMA,
} from './prompt-recomendacion';

const URL_API = 'https://api.mistral.ai/v1';
// El plan gratuito (Experiment) solo habilita el chat de los modelos ministral.
const MODELO_POR_DEFECTO = 'ministral-14b-latest';
const MODELO_EMBEDDING = 'mistral-embed';
const TIMEOUT_POR_DEFECTO_MS = 60000;
const INDICE_POR_DEFECTO = 'ia-documentos/indice.json';
const FRAGMENTOS_POR_CONSULTA = 5;
// El plan gratuito admite alrededor de un pedido por segundo.
const ESPERA_REINTENTO_MS = 1500;

type RespuestaIa = Omit<RecomendacionGenerada, 'fuentesConsultadas'> & {
  fragmentosCitados?: unknown;
};

/**
 * Recomendacion con Mistral usando los documentos de referencia (RAG):
 * busca los fragmentos relevantes del escenario en el indice generado por
 * npm run ia:indexar y le pide a la IA que razone sobre ellos y los cite.
 */
@Injectable()
export class MistralProvider implements RecommendationProvider {
  readonly modelo: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly base: BaseConocimiento;

  constructor(configService: ConfigService) {
    this.modelo =
      configService.get<string>('MISTRAL_MODEL') || MODELO_POR_DEFECTO;
    this.apiKey = configService.getOrThrow<string>('MISTRAL_API_KEY');
    this.timeoutMs =
      Number(configService.get<string>('MISTRAL_TIMEOUT_MS')) ||
      TIMEOUT_POR_DEFECTO_MS;
    this.base = new BaseConocimiento(
      configService.get<string>('IA_INDICE_PATH') || INDICE_POR_DEFECTO,
    );
  }

  async generar(contexto: ContextoEscenario): Promise<RecomendacionGenerada> {
    const vectores = await this.embeber(consultasDelEscenario(contexto));
    const fragmentos = await this.base.buscar(
      vectores,
      FRAGMENTOS_POR_CONSULTA,
    );
    const ids = fragmentos.map((_, i) => `F${i + 1}`);

    const respuesta = await this.post<{
      choices?: { message?: { content?: string } }[];
    }>('/chat/completions', {
      model: this.modelo,
      temperature: 0.3,
      messages: [
        { role: 'system', content: INSTRUCCIONES_SISTEMA },
        { role: 'user', content: armarPedido(contexto, fragmentos, ids) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recomendacion',
          schema: ESQUEMA_RECOMENDACION,
          strict: true,
        },
      },
    });

    const contenido = respuesta.choices?.[0]?.message?.content;
    if (!contenido) throw new Error('La IA no devolvio contenido');
    const { fragmentosCitados, ...generada } = JSON.parse(
      contenido,
    ) as RespuestaIa;

    const fuentes = fuentesCitadas(fragmentosCitados, fragmentos, ids);
    // Sin citas validas no hay forma de saber en que se baso: se descarta.
    if (fuentes.length === 0) {
      throw new Error('La IA no cito ningun fragmento de los documentos');
    }
    // La estructura la valida validarRecomendacion antes de guardar.
    return { ...limpiarTextos(generada), fuentesConsultadas: fuentes };
  }

  private async embeber(textos: string[]): Promise<number[][]> {
    const respuesta = await this.post<{ data?: { embedding: number[] }[] }>(
      '/embeddings',
      { model: MODELO_EMBEDDING, input: textos },
    );
    if (respuesta.data?.length !== textos.length) {
      throw new Error('Respuesta de embeddings incompleta');
    }
    return respuesta.data.map((d) => d.embedding);
  }

  /** POST a la API con timeout y un reintento si se supero el limite por segundo. */
  private async post<T>(
    ruta: string,
    body: object,
    reintento = true,
  ): Promise<T> {
    const respuesta = await fetch(`${URL_API}${ruta}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (respuesta.status === 429 && reintento) {
      await new Promise((r) => setTimeout(r, ESPERA_REINTENTO_MS));
      return this.post<T>(ruta, body, false);
    }
    if (!respuesta.ok) {
      const detalle = (await respuesta.text()).slice(0, 300);
      throw new Error(`Mistral respondio ${respuesta.status}: ${detalle}`);
    }
    return (await respuesta.json()) as T;
  }
}

/** Dos busquedas: una sobre la plaga en la etapa y otra sobre el clima. */
export function consultasDelEscenario(c: ContextoEscenario): string[] {
  const clima = c.clima
    .map(
      (d) =>
        `${d.temperatura} °C, ${d.precipitacion} mm de lluvia, ${d.humedad}% de humedad, viento ${d.viento} km/h`,
    )
    .join('; ');
  return [
    `Chinche verde en soja en la etapa ${c.etapa.nombre}: riesgo ${c.riesgoObservado}, daño, monitoreo con paño vertical, umbral o nivel de daño económico y decisión de control. ${c.observaciones ?? ''}`,
    `Condiciones climáticas para monitorear y aplicar insecticida en soja: ${clima}`,
  ];
}

function armarPedido(
  contexto: ContextoEscenario,
  fragmentos: Fragmento[],
  ids: string[],
): string {
  const documentos = fragmentos
    .map((f, i) => `[${ids[i]}] (${f.archivo}, pág. ${f.pagina})\n${f.texto}`)
    .join('\n\n');
  return `FRAGMENTOS DE LA DOCUMENTACIÓN:\n\n${documentos}\n\nESCENARIO A ANALIZAR:\n${JSON.stringify(contexto, null, 2)}`;
}

// Una cita a fragmentos dentro del texto: "[F1]", "(F2 y F3)", "según F4,".
const ID_FRAGMENTO = String.raw`\[?F\d+\]?`;
const LISTA_IDS = String.raw`${ID_FRAGMENTO}(?:\s*(?:,|y)\s*${ID_FRAGMENTO})*`;
const CITA_EN_TEXTO = new RegExp(
  String.raw`\s*\(?(?:según\s+(?:los\s+fragmentos\s+)?)?${LISTA_IDS}\)?,?`,
  'g',
);
// "Según F1, el umbral..." abre la oracion: se saca y se recupera la mayuscula.
const CITA_AL_INICIO = new RegExp(
  String.raw`Según\s+(?:los\s+fragmentos\s+)?${LISTA_IDS},?\s*([a-záéíóúñ])`,
  'g',
);

/** Saca marcas que el usuario no entiende: citas a fragmentos, negritas y cursivas. */
export function limpiarTexto(texto: string): string {
  return texto
    .replace(CITA_AL_INICIO, (_, letra: string) => letra.toUpperCase())
    .replace(CITA_EN_TEXTO, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}

function limpiarTextos<T extends object>(generada: T): T {
  return Object.fromEntries(
    Object.entries(generada).map(([clave, valor]) => [
      clave,
      typeof valor === 'string'
        ? limpiarTexto(valor)
        : Array.isArray(valor)
          ? (valor as unknown[]).map((v) =>
              typeof v === 'string' ? limpiarTexto(v) : v,
            )
          : valor,
    ]),
  ) as T;
}

/** Traduce los ids citados por la IA a documento y pagina, sin repetir. */
export function fuentesCitadas(
  citados: unknown,
  fragmentos: Fragmento[],
  ids: string[],
): FuenteConsultada[] {
  if (!Array.isArray(citados)) return [];
  const fuentes = new Map<string, FuenteConsultada>();
  for (const id of citados) {
    const i = ids.indexOf(String(id).replace(/[[\]]/g, '').trim());
    if (i === -1) continue;
    const { archivo, pagina } = fragmentos[i];
    fuentes.set(`${archivo}|${pagina}`, {
      titulo: archivo,
      referencia: `pág. ${pagina}`,
    });
  }
  return [...fuentes.values()];
}
