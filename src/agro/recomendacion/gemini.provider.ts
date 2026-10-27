import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  ContextoEscenario,
  FuenteConsultada,
  RecomendacionGenerada,
  RecommendationProvider,
} from './recommendation-provider.interface';
import { ESQUEMA_RECOMENDACION, INSTRUCCIONES_SISTEMA } from './gemini-prompt';

const MODELO_POR_DEFECTO = 'gemini-3.8-flash';
// File Search suma latencia: la respuesta suele tardar varios segundos.
const TIMEOUT_POR_DEFECTO_MS = 60000;

/** Lo minimo que se lee de la respuesta de la Interactions API. */
interface RespuestaInteraccion {
  output_text?: string;
  steps?: {
    content?: {
      annotations?: {
        type: string;
        file_name?: string;
        page_number?: number;
      }[];
    }[];
  }[];
}

/**
 * Recomendacion con Gemini + File Search: el modelo busca en los documentos
 * indexados con `npm run ia:indexar` y responde con el esquema de SID-Agro.
 * Si falla, la simulacion queda en ERROR y se reintenta desde el endpoint.
 */
@Injectable()
export class GeminiProvider implements RecommendationProvider {
  readonly modelo: string;
  private readonly ai: GoogleGenAI;
  private readonly store: string;
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    this.modelo =
      configService.get<string>('GEMINI_MODEL') || MODELO_POR_DEFECTO;
    this.store = configService.getOrThrow<string>('GEMINI_FILE_SEARCH_STORE');
    this.timeoutMs =
      Number(configService.get<string>('GEMINI_TIMEOUT_MS')) ||
      TIMEOUT_POR_DEFECTO_MS;
    this.ai = new GoogleGenAI({
      apiKey: configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
  }

  async generar(contexto: ContextoEscenario): Promise<RecomendacionGenerada> {
    const interaccion = (await this.ai.interactions.create(
      {
        model: this.modelo,
        system_instruction: INSTRUCCIONES_SISTEMA,
        input: `Escenario a analizar:\n${JSON.stringify(contexto, null, 2)}`,
        tools: [{ type: 'file_search', file_search_store_names: [this.store] }],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: ESQUEMA_RECOMENDACION,
        },
      },
      { timeout_ms: this.timeoutMs },
    )) as RespuestaInteraccion;

    if (!interaccion.output_text) {
      throw new Error('Gemini no devolvio texto');
    }
    // La estructura la valida validarRecomendacion antes de guardar.
    const generada = JSON.parse(
      interaccion.output_text,
    ) as RecomendacionGenerada;

    // Las citas reales de File Search valen mas que lo que el modelo declara.
    const citadas = fuentesCitadas(interaccion);
    if (citadas.length > 0) {
      generada.fuentesConsultadas = citadas;
    } else if (Array.isArray(generada.advertencias)) {
      generada.advertencias.push(
        'La respuesta no cita pasajes de los documentos de referencia: revisarla con especial cuidado.',
      );
    }
    return generada;
  }
}

/** Documentos citados por File Search, sin repetir documento y pagina. */
export function fuentesCitadas(
  interaccion: RespuestaInteraccion,
): FuenteConsultada[] {
  const fuentes = new Map<string, FuenteConsultada>();
  for (const step of interaccion.steps ?? []) {
    for (const contenido of step.content ?? []) {
      for (const cita of contenido.annotations ?? []) {
        if (cita.type !== 'file_citation' || !cita.file_name) continue;
        const referencia = cita.page_number
          ? `pág. ${cita.page_number}`
          : undefined;
        fuentes.set(`${cita.file_name}|${referencia}`, {
          titulo: cita.file_name,
          ...(referencia && { referencia }),
        });
      }
    }
  }
  return [...fuentes.values()];
}
