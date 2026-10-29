import { NivelRiesgo } from '../enums/agro.enums';
import { ContextoEscenario } from './recommendation-provider.interface';
import { ReglasLocalesProvider } from './reglas-locales.provider';
import {
  fechasAnteriores,
  validarRecomendacion,
} from './validar-recomendacion';

const dia = (fecha: string, precipitacion = 0, viento = 10) => ({
  fecha,
  temperatura: 24,
  precipitacion,
  humedad: 60,
  viento,
});

const contexto = (
  overrides: Partial<ContextoEscenario> = {},
): ContextoEscenario => ({
  fechaSimulacion: '2026-11-01',
  fechaSiembra: '2026-04-09',
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
  riesgoObservado: NivelRiesgo.MODERADO,
  observaciones: 'Chinches en el borde',
  fuenteClimatica: 'MANUAL',
  proveedorClimatico: null,
  clima: [dia('2026-11-01'), dia('2026-11-02', 12), dia('2026-11-03', 0, 25)],
  ...overrides,
});

describe('ReglasLocalesProvider', () => {
  const provider = new ReglasLocalesProvider();

  it('genera una recomendacion con estructura valida', async () => {
    const r = await provider.generar(contexto());
    expect(validarRecomendacion(r)).toEqual([]);
  });

  it('toma el mayor entre el riesgo base y el observado', async () => {
    const r = await provider.generar(contexto());
    expect(r.nivelRiesgo).toBe(NivelRiesgo.ALTO);
    expect(r.prioridad).toBe('ALTA');

    const bajo = await provider.generar(
      contexto({
        etapa: { ...contexto().etapa, riesgoBase: 'Muy bajo' },
        riesgoObservado: NivelRiesgo.MUY_ALTO,
      }),
    );
    expect(bajo.nivelRiesgo).toBe(NivelRiesgo.MUY_ALTO);
  });

  it('sugiere solo los dias sin lluvia ni viento fuerte como ventana', async () => {
    const r = await provider.generar(contexto());
    const ventana = r.accionesSugeridas.find((a) => a.includes('días aptos'));
    expect(ventana).toContain('2026-11-01');
    expect(ventana).not.toContain('2026-11-02');
    expect(ventana).not.toContain('2026-11-03');
  });

  it('avisa cuando no hay dias aptos para aplicar', async () => {
    const r = await provider.generar(
      contexto({ clima: [dia('2026-11-01', 20), dia('2026-11-02', 0, 30)] }),
    );
    expect(r.accionesSugeridas.join(' ')).toContain('No hay días aptos');
  });

  it('con riesgo bajo no sugiere aplicar', async () => {
    const r = await provider.generar(
      contexto({
        etapa: { ...contexto().etapa, riesgoBase: 'Bajo' },
        riesgoObservado: NivelRiesgo.MUY_BAJO,
      }),
    );
    expect(r.prioridad).toBe('BAJA');
    expect(r.recomendacionPrincipal).toContain('no se justifica');
  });

  it('no propone como ventana los dias anteriores a la simulacion', async () => {
    const r = await provider.generar(
      contexto({
        fechaSimulacion: '2026-11-02',
        clima: [dia('2026-10-31'), dia('2026-11-01'), dia('2026-11-04')],
      }),
    );
    const textos = [r.recomendacionPrincipal, ...r.accionesSugeridas].join(' ');
    expect(textos).toContain('2026-11-04');
    expect(textos).not.toContain('2026-10-31');
    expect(textos).not.toContain('2026-11-01');
  });

  it('advierte que el pronostico es de la capital cuando viene de la API', async () => {
    const r = await provider.generar(
      contexto({ fuenteClimatica: 'API', proveedorClimatico: 'Open-Meteo' }),
    );
    expect(r.advertencias.join(' ')).toContain('capital de San Luis');
  });
});

describe('validarRecomendacion', () => {
  it('detecta campos faltantes o con tipo incorrecto', () => {
    const errores = validarRecomendacion({
      resumen: '',
      accionesSugeridas: 'aplicar',
      nivelRiesgo: 'Altisimo',
    });
    expect(errores).toEqual(
      expect.arrayContaining([
        'resumen debe ser un texto no vacio',
        'accionesSugeridas debe ser una lista de textos',
        'nivelRiesgo no es un valor valido',
      ]),
    );
  });
});

describe('fechasAnteriores', () => {
  it('reconoce fechas ISO, dd/mm(/aaaa) y en palabras', () => {
    expect(
      fechasAnteriores(
        'Monitorear el 27 de octubre, el 26/10, el 25/10/2026 y el 2026-10-24; aplicar el 30 de octubre.',
        '2026-10-28',
      ),
    ).toEqual(['2026-10-27', '2026-10-26', '2026-10-25', '2026-10-24']);
  });

  it('sin anio, enero despues de diciembre es del anio siguiente', () => {
    expect(fechasAnteriores('Monitorear el 2 de enero', '2026-12-30')).toEqual(
      [],
    );
  });
});

describe('validarRecomendacion con fecha de simulacion', () => {
  it('rechaza acciones con fechas que ya pasaron', async () => {
    const r = await new ReglasLocalesProvider().generar(contexto());
    const errores = validarRecomendacion(
      {
        ...r,
        accionesSugeridas: ['Monitorear el 27 de octubre en los bordes.'],
      },
      '2026-10-28',
    );
    expect(errores).toEqual([
      'accionesSugeridas propone fechas anteriores a la simulacion (2026-10-28): 2026-10-27',
    ]);
  });
});
