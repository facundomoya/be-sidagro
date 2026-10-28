import { PronosticoDiario } from '../clima/climate-provider.interface';
import { IconoClima } from '../clima/estado-cielo';
import {
  calcularMonitoreo,
  CalificacionDia,
  calificarDia,
  EntradaMonitoreo,
  EtapaReferencia,
  etapaPorGdda,
  frecuenciaEnDias,
  gradosDia,
  NivelAlerta,
  sumarDias,
} from './calculo-monitoreo';

// Las mismas etapas que carga la migracion SidAgroDomainCore.
const etapas: EtapaReferencia[] = [
  ['Emergencia - Vn', 0, 500, 'No se recomienda', 'Muy bajo'],
  ['R1 - Inicio de floración', 500, 600, 'Cada 7 días', 'Muy bajo'],
  ['R2 - Floración plena', 600, 750, 'Cada 7 días', 'Bajo'],
  ['R3 - Formación de vainas', 750, 900, 'Cada 3 días', 'Alto'],
  ['R4 - Vaina completa', 900, 1050, 'Cada 3 días', 'Alto'],
  ['R5 - Grano iniciando', 1050, 1250, 'Cada 3 días', 'Alto'],
  ['R6 - Llenado de granos', 1250, 1400, 'Cada 7 días', 'Moderado'],
  ['R7 - Madurez fisiológica', 1400, 1500, 'Cada 7 días', 'Bajo'],
  ['R8 - Madurez de cosecha', 1500, 1600, 'Cada 7 días', 'Bajo'],
].map(([nombre, min, max, frecuenciaMonitoreo, riesgoChinche], i) => ({
  id: i + 1,
  nombre: nombre as string,
  gddaMinimo: min as number,
  gddaMaximo: max as number,
  frecuenciaMonitoreo: frecuenciaMonitoreo as string,
  riesgoChinche: riesgoChinche as string,
}));

const HOY = '2026-10-27';
const SIEMBRA = '2026-08-01';

/** 25/15 °C todos los dias: 10 grados dia por dia. */
const temperaturasHasta = (hasta: string) => {
  const serie = [];
  for (let f = SIEMBRA; f <= hasta; f = sumarDias(f, 1)) {
    serie.push({ fecha: f, maxima: 25, minima: 15 });
  }
  return serie;
};

const dia = (
  fecha: string,
  precipitacion = 0,
  viento = 8,
): PronosticoDiario => ({
  fecha,
  temperatura: 20,
  precipitacion,
  humedad: 60,
  viento,
  probabilidadLluvia: null,
  estadoCielo: {
    codigo: 0,
    descripcion: 'Cielo despejado',
    icono: IconoClima.DESPEJADO,
  },
});

// Hoy llueve, manana hay viento moderado y despues el tiempo es bueno.
const pronostico = [
  dia(HOY, 10),
  dia(sumarDias(HOY, 1), 0, 18),
  ...[2, 3, 4, 5, 6].map((n) => dia(sumarDias(HOY, n))),
];

const entrada = (
  cambios: Partial<EntradaMonitoreo> = {},
): EntradaMonitoreo => ({
  fechaSiembra: SIEMBRA,
  hoy: HOY,
  temperaturas: temperaturasHasta(sumarDias(HOY, 6)),
  pronostico,
  etapas,
  observaciones: [],
  ...cambios,
});

describe('calculo del monitoreo', () => {
  it('grados dia: media sobre 10 °C y nunca negativos', () => {
    expect(gradosDia({ fecha: HOY, maxima: 30, minima: 18 })).toBe(14);
    expect(gradosDia({ fecha: HOY, maxima: 12, minima: 2 })).toBe(0);
  });

  it('frecuencia y etapa por GDDA', () => {
    expect(frecuenciaEnDias('Cada 3 días')).toBe(3);
    expect(frecuenciaEnDias('No se recomienda')).toBeNull();
    expect(etapaPorGdda(etapas, 880).nombre).toBe('R3 - Formación de vainas');
    expect(etapaPorGdda(etapas, 2000).nombre).toBe('R8 - Madurez de cosecha');
  });

  it('califica los dias por lluvia y viento', () => {
    expect(calificarDia(dia(HOY, 10)).calificacion).toBe(
      CalificacionDia.RIESGOSA,
    );
    expect(calificarDia(dia(HOY, 0, 18)).calificacion).toBe(
      CalificacionDia.ACEPTABLE,
    );
    expect(calificarDia(dia(HOY)).calificacion).toBe(CalificacionDia.OPTIMA);
  });

  it('acumula hasta hoy, estima la etapa y avisa que es critica', () => {
    const r = calcularMonitoreo(entrada());

    // Del 1/8 al 27/10 inclusive son 88 dias de 10 grados dia.
    expect(r.gddaAcumulado).toBe(880);
    expect(r.gddHoy).toBe(10);
    expect(r.diasDesdeSiembra).toBe(87);
    expect(r.etapaActual.nombre).toBe('R3 - Formación de vainas');
    expect(r.nivelRiesgo).toBe('Alto');
    expect(r.alertas.map((a) => a.tipo)).toEqual(
      expect.arrayContaining(['ETAPA_CRITICA', 'CLIMA_DESFAVORABLE']),
    );
  });

  it('proyecta las etapas: R4 empieza cuando el GDDA llega a 900', () => {
    const r = calcularMonitoreo(entrada());
    const r4 = r.ventanasEtapas.find((v) => v.etapa.startsWith('R4'))!;

    expect(r4.fechaInicioEstimada).toBe('2026-10-29');
    expect(r4.critica).toBe(true);
    // R8 queda despues del pronostico: se proyecta con el promedio de 10/dia.
    const r8 = r.ventanasEtapas.find((v) => v.etapa.startsWith('R8'))!;
    expect(r8.fechaInicioEstimada).toBe(sumarDias(SIEMBRA, 149));
  });

  it('sin observaciones sugiere monitorear el primer dia optimo', () => {
    const r = calcularMonitoreo(entrada());

    // Hoy llueve y manana hay viento: el primer dia optimo es pasado manana.
    expect(r.proximoMonitoreo.fecha).toBe(sumarDias(HOY, 2));
    expect(r.fechasMonitoreo[0].calificacion).toBe(CalificacionDia.RIESGOSA);
    expect(r.fechasMonitoreo[0].gddaProyectado).toBe(880);
  });

  it('suma la frecuencia de la etapa a la ultima observacion', () => {
    const r = calcularMonitoreo(
      entrada({
        observaciones: [
          { fecha: sumarDias(HOY, -1), presencia: false, densidad: null },
        ],
      }),
    );

    // Ultima ayer + cada 3 dias = pasado manana, que es optimo.
    expect(r.proximoMonitoreo.fecha).toBe(sumarDias(HOY, 2));
    expect(r.alertas.map((a) => a.tipo)).not.toContain('MONITOREO_ATRASADO');
  });

  it('avisa el monitoreo atrasado aunque el clima corra la fecha', () => {
    const r = calcularMonitoreo(
      entrada({
        observaciones: [
          { fecha: sumarDias(HOY, -10), presencia: false, densidad: null },
        ],
      }),
    );

    expect(r.proximoMonitoreo.motivo).toMatch(/^Atrasado/);
    const atrasado = r.alertas.find((a) => a.tipo === 'MONITOREO_ATRASADO');
    expect(atrasado?.nivel).toBe(NivelAlerta.CRITICA);
  });

  it('sube el riesgo con chinches presentes y mas si vienen en aumento', () => {
    const presentes = calcularMonitoreo(
      entrada({
        observaciones: [
          { fecha: sumarDias(HOY, -1), presencia: true, densidad: 2 },
        ],
      }),
    );
    expect(presentes.nivelRiesgo).toBe('Muy alto');
    expect(presentes.alertas.map((a) => a.tipo)).toContain(
      'PRESENCIA_EN_ETAPA_CRITICA',
    );

    const enAumento = calcularMonitoreo(
      entrada({
        etapas: etapas.map((e) =>
          e.nombre.startsWith('R3') ? { ...e, riesgoChinche: 'Bajo' } : e,
        ),
        observaciones: [
          { fecha: sumarDias(HOY, -1), presencia: true, densidad: 5 },
          { fecha: sumarDias(HOY, -4), presencia: true, densidad: 2 },
        ],
      }),
    );
    expect(enAumento.nivelRiesgo).toBe('Alto');
    expect(enAumento.alertas.map((a) => a.tipo)).toContain(
      'DENSIDAD_EN_AUMENTO',
    );
  });

  it('en emergencia no pide monitorear hasta el inicio de R1', () => {
    const hoy = '2026-08-20';
    const r = calcularMonitoreo(
      entrada({
        hoy,
        temperaturas: temperaturasHasta(sumarDias(hoy, 6)),
        pronostico: [0, 1, 2, 3, 4, 5, 6].map((n) => dia(sumarDias(hoy, n))),
      }),
    );

    expect(r.etapaActual.nombre).toBe('Emergencia - Vn');
    // R1 empieza con 500 grados dia: 50 dias despues de la siembra.
    expect(r.proximoMonitoreo.fecha).toBe(sumarDias(SIEMBRA, 49));
    expect(r.nivelRiesgo).toBe('Muy bajo');
  });
});
