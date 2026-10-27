import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { GeminiProvider } from './gemini.provider';
import { ContextoEscenario } from './recommendation-provider.interface';
import { ReglasLocalesProvider } from './reglas-locales.provider';
import { validarRecomendacion } from './validar-recomendacion';

jest.mock('@google/genai');

const contexto: ContextoEscenario = {
  provincia: 'San Luis',
  campania: '2026/2027',
  lote: 'Lote Norte',
  etapa: {
    nombre: 'R3 - Formacion de vainas',
    gddaMinimo: 750,
    gddaMaximo: 900,
    frecuenciaMonitoreo: 'Cada 3 dias',
    riesgoBase: 'Alto',
  },
  riesgoObservado: 'Moderado',
  observaciones: null,
  fuenteClimatica: 'MANUAL',
  proveedorClimatico: null,
  clima: [
    {
      fecha: '2026-11-01',
      temperatura: 24,
      precipitacion: 0,
      humedad: 60,
      viento: 10,
    },
  ],
};

const config = (valores: Record<string, string>) =>
  ({
    get: (k: string) => valores[k],
    getOrThrow: (k: string) => valores[k],
  }) as unknown as ConfigService;

describe('GeminiProvider', () => {
  let create: jest.Mock;
  let provider: GeminiProvider;
  let valida: object;

  beforeEach(async () => {
    create = jest.fn();
    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      interactions: { create },
    }));
    provider = new GeminiProvider(
      config({
        GEMINI_API_KEY: 'clave-de-prueba',
        GEMINI_FILE_SEARCH_STORE: 'fileSearchStores/sid-agro',
      }),
    );
    // Una respuesta con la estructura correcta, como la que pediria el esquema.
    valida = await new ReglasLocalesProvider().generar(contexto);
  });

  it('envia el escenario con File Search y el esquema de respuesta', async () => {
    create.mockResolvedValue({ output_text: JSON.stringify(valida) });

    await provider.generar(contexto);

    const [params] = create.mock.calls[0] as [Record<string, unknown>];
    expect(params).toMatchObject({
      model: 'gemini-3.8-flash',
      tools: [
        {
          type: 'file_search',
          file_search_store_names: ['fileSearchStores/sid-agro'],
        },
      ],
      response_format: { type: 'text', mime_type: 'application/json' },
    });
    expect(params.input).toContain('Lote Norte');
  });

  it('usa las citas de File Search como fuentes consultadas', async () => {
    const cita = (page_number?: number) => ({
      type: 'file_citation',
      file_name: 'Explicación cultivo de la soja.pdf',
      page_number,
    });
    create.mockResolvedValue({
      output_text: JSON.stringify(valida),
      steps: [{ content: [{ annotations: [cita(4), cita(4), cita(7)] }] }],
    });

    const r = await provider.generar(contexto);

    expect(r.fuentesConsultadas).toEqual([
      { titulo: 'Explicación cultivo de la soja.pdf', referencia: 'pág. 4' },
      { titulo: 'Explicación cultivo de la soja.pdf', referencia: 'pág. 7' },
    ]);
    expect(validarRecomendacion(r)).toEqual([]);
  });

  it('advierte cuando la respuesta no cita documentos', async () => {
    create.mockResolvedValue({ output_text: JSON.stringify(valida) });

    const r = await provider.generar(contexto);

    expect(r.advertencias.join(' ')).toContain('no cita pasajes');
  });

  it('falla si Gemini no devuelve texto', async () => {
    create.mockResolvedValue({});

    await expect(provider.generar(contexto)).rejects.toThrow(
      'Gemini no devolvio texto',
    );
  });
});
