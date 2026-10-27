import { ConfigService } from '@nestjs/config';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { IndiceDocumentos } from './base-conocimiento';
import { MistralProvider } from './mistral.provider';
import { ContextoEscenario } from './recommendation-provider.interface';
import { ReglasLocalesProvider } from './reglas-locales.provider';
import { validarRecomendacion } from './validar-recomendacion';

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
  riesgoObservado: 'Alto',
  observaciones: 'Chinches en el borde',
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

// Dos fragmentos con vectores opuestos: la busqueda debe elegir por similitud.
const indice: IndiceDocumentos = {
  modeloEmbedding: 'mistral-embed',
  creado: '2026-10-27',
  fragmentos: [
    {
      id: '1',
      archivo: 'Chinches en Soja.pdf',
      pagina: 2,
      texto: 'Umbral en R3: 0,5 chinches por metro.',
      vector: [1, 0],
    },
    {
      id: '2',
      archivo: 'Deriva.pdf',
      pagina: 5,
      texto: 'No aplicar con viento mayor a 15 km/h.',
      vector: [0, 1],
    },
  ],
};

const respuestaJson = (body: unknown, status = 200) =>
  ({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as Response;

describe('MistralProvider', () => {
  let fetchMock: jest.SpyInstance;
  let provider: MistralProvider;
  let respuestaIa: Record<string, unknown>;

  beforeEach(async () => {
    const carpeta = mkdtempSync(join(tmpdir(), 'sidagro-'));
    const ruta = join(carpeta, 'indice.json');
    writeFileSync(ruta, JSON.stringify(indice));
    const valores: Record<string, string> = {
      MISTRAL_API_KEY: 'clave-de-prueba',
      IA_INDICE_PATH: ruta,
    };
    provider = new MistralProvider({
      get: (k: string) => valores[k],
      getOrThrow: (k: string) => valores[k],
    } as unknown as ConfigService);

    // La IA devuelve ids de fragmentos en lugar de fuentes.
    respuestaIa = {
      ...(await new ReglasLocalesProvider().generar(contexto)),
      fragmentosCitados: ['F1', 'F2'],
    };
    delete respuestaIa.fuentesConsultadas;

    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation((url: string | URL | Request) =>
        Promise.resolve(
          (url as string).endsWith('/embeddings')
            ? respuestaJson({
                data: [{ embedding: [1, 0.1] }, { embedding: [0.1, 1] }],
              })
            : respuestaJson({
                choices: [
                  { message: { content: JSON.stringify(respuestaIa) } },
                ],
              }),
        ),
      );
  });

  afterEach(() => fetchMock.mockRestore());

  const pedidoChat = () => {
    const llamada = (fetchMock.mock.calls as [string, RequestInit][]).find(
      ([url]) => url.endsWith('/chat/completions'),
    );
    return JSON.parse(llamada![1].body as string) as {
      model: string;
      messages: { content: string }[];
      response_format: { type: string };
    };
  };

  it('le pasa a la IA los fragmentos encontrados y el escenario', async () => {
    await provider.generar(contexto);

    const pedido = pedidoChat();
    expect(pedido.model).toBe('ministral-14b-latest');
    expect(pedido.response_format.type).toBe('json_schema');
    const mensaje = pedido.messages[1].content;
    expect(mensaje).toContain('[F1] (Chinches en Soja.pdf, pág. 2)');
    expect(mensaje).toContain('Umbral en R3');
    expect(mensaje).toContain('Lote Norte');
  });

  it('arma las fuentes con documento y pagina de los fragmentos citados', async () => {
    const r = await provider.generar(contexto);

    const fuentes = [
      { titulo: 'Chinches en Soja.pdf', referencia: 'pág. 2' },
      { titulo: 'Deriva.pdf', referencia: 'pág. 5' },
    ];
    expect(r.fuentesConsultadas).toEqual(expect.arrayContaining(fuentes));
    expect(r).not.toHaveProperty('fragmentosCitados');
    expect(validarRecomendacion(r)).toEqual([]);
  });

  it('saca los ids de fragmentos y las negritas de los textos', async () => {
    respuestaIa.resumen =
      'Riesgo **alto** en R3 [F1], [F2]. Según F1 y F4, el umbral es menor (según F3) para *P. guildinii*. Monitorear bordes (F6 y F8).';

    const r = await provider.generar(contexto);

    expect(r.resumen).toBe(
      'Riesgo alto en R3. El umbral es menor para P. guildinii. Monitorear bordes.',
    );
  });

  it('descarta la respuesta si no cita ningun fragmento valido', async () => {
    respuestaIa.fragmentosCitados = ['F99'];

    await expect(provider.generar(contexto)).rejects.toThrow(
      'no cito ningun fragmento',
    );
  });

  it('informa el error de la API', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ message: 'caido' }, 500));

    await expect(provider.generar(contexto)).rejects.toThrow(
      'Mistral respondio 500',
    );
  });

  it('pide ejecutar la indexacion si no existe el indice', async () => {
    const sinIndice = new MistralProvider({
      get: (k: string) =>
        k === 'IA_INDICE_PATH' ? join(tmpdir(), 'no-existe.json') : undefined,
      getOrThrow: () => 'clave',
    } as unknown as ConfigService);

    await expect(sinIndice.generar(contexto)).rejects.toThrow(
      'npm run ia:indexar',
    );
  });
});
