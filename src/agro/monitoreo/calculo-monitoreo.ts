import { NivelRiesgo } from '../enums/agro.enums';
import type {
  PronosticoDiario,
  TemperaturaDiaria,
} from '../clima/climate-provider.interface';

/**
 * Calculo del monitoreo de chinche verde (CU 06), sin IA: grados dia desde la
 * siembra, etapa estimada, fechas para monitorear y alertas. Todo es puro para
 * poder testearlo; los umbrales son provisionales y los valida el ingeniero.
 */

/** Temperatura base de la soja para grados dia (°C). */
export const TEMPERATURA_BASE = 10;
/** Si no hay pronostico, la proyeccion usa el promedio de estos ultimos dias. */
const DIAS_PROMEDIO_PROYECCION = 7;
const MAX_DIAS_PROYECCION = 200;
// Dias de muestreo con pano vertical: con lluvia o viento fuerte no es confiable.
const LLUVIA_RIESGOSA_MM = 5;
const LLUVIA_ACEPTABLE_MM = 1;
const VIENTO_RIESGOSO_KMH = 25;
const VIENTO_ACEPTABLE_KMH = 15;

const NIVELES = Object.values(NivelRiesgo);
const RIESGOS_CRITICOS: string[] = [NivelRiesgo.ALTO, NivelRiesgo.MUY_ALTO];
const MS_POR_DIA = 86_400_000;

export enum CalificacionDia {
  OPTIMA = 'OPTIMA',
  ACEPTABLE = 'ACEPTABLE',
  RIESGOSA = 'RIESGOSA',
}

export enum NivelAlerta {
  INFO = 'INFO',
  ADVERTENCIA = 'ADVERTENCIA',
  CRITICA = 'CRITICA',
}

export interface EtapaReferencia {
  id: number;
  nombre: string;
  gddaMinimo: number;
  gddaMaximo: number;
  frecuenciaMonitoreo: string;
  riesgoChinche: string;
}

export interface ObservacionReferencia {
  fecha: string;
  presencia: boolean;
  densidad: number | null;
}

export interface EntradaMonitoreo {
  fechaSiembra: string;
  hoy: string;
  /** Desde la siembra hasta los proximos dias de pronostico. */
  temperaturas: TemperaturaDiaria[];
  pronostico: PronosticoDiario[];
  /** Ordenadas por gddaMinimo. */
  etapas: EtapaReferencia[];
  /** Ordenadas de la mas reciente a la mas vieja. */
  observaciones: ObservacionReferencia[];
}

export interface DiaMonitoreo {
  fecha: string;
  gddaProyectado: number;
  etapa: string;
  calificacion: CalificacionDia;
  motivo: string;
  temperatura: number;
  precipitacion: number;
  viento: number;
  humedad: number;
  probabilidadLluvia: number | null;
  estadoCielo: PronosticoDiario['estadoCielo'];
}

export interface VentanaEtapa {
  etapa: string;
  riesgoChinche: string;
  frecuenciaMonitoreo: string;
  gddaMinimo: number;
  gddaMaximo: number;
  fechaInicioEstimada: string | null;
  fechaFinEstimada: string | null;
  critica: boolean;
}

export interface Alerta {
  tipo: string;
  nivel: NivelAlerta;
  mensaje: string;
}

export interface ResultadoMonitoreo {
  diasDesdeSiembra: number;
  gddHoy: number;
  gddaAcumulado: number;
  etapaActual: EtapaReferencia;
  cicloCumplido: boolean;
  nivelRiesgo: string;
  motivoRiesgo: string;
  ventanasEtapas: VentanaEtapa[];
  fechasMonitoreo: DiaMonitoreo[];
  proximoMonitoreo: { fecha: string; motivo: string };
  alertas: Alerta[];
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export const sumarDias = (fecha: string, dias: number): string =>
  new Date(Date.parse(fecha) + dias * MS_POR_DIA).toISOString().slice(0, 10);

export const diasEntre = (desde: string, hasta: string): number =>
  Math.round((Date.parse(hasta) - Date.parse(desde)) / MS_POR_DIA);

/** Grados dia de un dia: temperatura media sobre la base, nunca negativo. */
export function gradosDia(t: TemperaturaDiaria): number {
  return Math.max(0, (t.maxima + t.minima) / 2 - TEMPERATURA_BASE);
}

/** "Cada 3 días" -> 3; "No se recomienda" -> null. */
export function frecuenciaEnDias(frecuencia: string): number | null {
  const n = /(\d+)/.exec(frecuencia);
  return n ? Number(n[1]) : null;
}

/** La etapa cuyo rango contiene el GDDA; despues de la ultima, la ultima. */
export function etapaPorGdda(
  etapas: EtapaReferencia[],
  gdda: number,
): EtapaReferencia {
  return (
    etapas.find((e) => gdda >= e.gddaMinimo && gdda < e.gddaMaximo) ??
    (gdda < etapas[0].gddaMinimo ? etapas[0] : etapas[etapas.length - 1])
  );
}

export function calificarDia(d: PronosticoDiario): {
  calificacion: CalificacionDia;
  motivo: string;
} {
  if (d.precipitacion >= LLUVIA_RIESGOSA_MM || d.viento > VIENTO_RIESGOSO_KMH) {
    return {
      calificacion: CalificacionDia.RIESGOSA,
      motivo: `Lluvia de ${d.precipitacion} mm o viento de ${d.viento} km/h: el muestreo con paño no es confiable`,
    };
  }
  if (
    d.precipitacion >= LLUVIA_ACEPTABLE_MM ||
    d.viento > VIENTO_ACEPTABLE_KMH
  ) {
    return {
      calificacion: CalificacionDia.ACEPTABLE,
      motivo: `Lluvia leve (${d.precipitacion} mm) o viento moderado (${d.viento} km/h)`,
    };
  }
  return {
    calificacion: CalificacionDia.OPTIMA,
    motivo: 'Sin lluvia y con poco viento',
  };
}

export function calcularMonitoreo(e: EntradaMonitoreo): ResultadoMonitoreo {
  // GDDA por fecha: real hasta hoy y pronosticado despues.
  const gddaPorFecha = new Map<string, number>();
  let acumulado = 0;
  let gddaAcumulado = 0;
  let gddHoy = 0;
  const gddPasados: number[] = [];
  for (const t of e.temperaturas) {
    const gdd = gradosDia(t);
    acumulado += gdd;
    gddaPorFecha.set(t.fecha, acumulado);
    if (t.fecha <= e.hoy) {
      gddaAcumulado = acumulado;
      gddPasados.push(gdd);
      if (t.fecha === e.hoy) gddHoy = gdd;
    }
  }
  const ultimos = gddPasados.slice(-DIAS_PROMEDIO_PROYECCION);
  const gddPromedio =
    ultimos.reduce((a, b) => a + b, 0) / Math.max(1, ultimos.length);

  const etapaActual = etapaPorGdda(e.etapas, gddaAcumulado);
  const ultimaEtapa = e.etapas[e.etapas.length - 1];
  const cicloCumplido = gddaAcumulado >= ultimaEtapa.gddaMaximo;

  const ventanasEtapas = proyectarEtapas(
    e,
    gddaPorFecha,
    acumulado,
    gddPromedio,
  );

  const fechasMonitoreo: DiaMonitoreo[] = e.pronostico
    .filter((d) => d.fecha >= e.hoy)
    .map((d) => {
      const gdda = gddaPorFecha.get(d.fecha) ?? gddaAcumulado;
      return {
        fecha: d.fecha,
        gddaProyectado: redondear(gdda),
        etapa: etapaPorGdda(e.etapas, gdda).nombre,
        ...calificarDia(d),
        temperatura: d.temperatura,
        precipitacion: d.precipitacion,
        viento: d.viento,
        humedad: d.humedad,
        probabilidadLluvia: d.probabilidadLluvia,
        estadoCielo: d.estadoCielo,
      };
    });

  const riesgo = nivelRiesgo(etapaActual, e.observaciones, e.hoy);
  const { atrasado, ...proximo } = proximoMonitoreo(
    e,
    etapaActual,
    ventanasEtapas,
    fechasMonitoreo,
  );

  return {
    diasDesdeSiembra: diasEntre(e.fechaSiembra, e.hoy),
    gddHoy: redondear(gddHoy),
    gddaAcumulado: redondear(gddaAcumulado),
    etapaActual,
    cicloCumplido,
    nivelRiesgo: riesgo.nivel,
    motivoRiesgo: riesgo.motivo,
    ventanasEtapas,
    fechasMonitoreo,
    proximoMonitoreo: proximo,
    alertas: alertas(e, {
      etapaActual,
      cicloCumplido,
      ventanasEtapas,
      fechasMonitoreo,
      atrasado,
    }),
  };
}

/** Fecha estimada de inicio y fin de cada etapa, real o proyectada. */
function proyectarEtapas(
  e: EntradaMonitoreo,
  gddaPorFecha: Map<string, number>,
  acumuladoFinal: number,
  gddPromedio: number,
): VentanaEtapa[] {
  const fechas = [...gddaPorFecha.keys()];
  const ultimaFecha = fechas[fechas.length - 1];

  const fechaEnQueLlega = (objetivo: number): string | null => {
    if (objetivo <= 0) return e.fechaSiembra;
    const real = fechas.find((f) => gddaPorFecha.get(f)! >= objetivo);
    if (real) return real;
    if (gddPromedio <= 0) return null;
    const dias = Math.ceil((objetivo - acumuladoFinal) / gddPromedio);
    return dias <= MAX_DIAS_PROYECCION ? sumarDias(ultimaFecha, dias) : null;
  };

  return e.etapas.map((etapa) => ({
    etapa: etapa.nombre,
    riesgoChinche: etapa.riesgoChinche,
    frecuenciaMonitoreo: etapa.frecuenciaMonitoreo,
    gddaMinimo: etapa.gddaMinimo,
    gddaMaximo: etapa.gddaMaximo,
    fechaInicioEstimada: fechaEnQueLlega(etapa.gddaMinimo),
    fechaFinEstimada: fechaEnQueLlega(etapa.gddaMaximo),
    critica: RIESGOS_CRITICOS.includes(etapa.riesgoChinche),
  }));
}

/**
 * Riesgo base de la etapa, subido un nivel si la ultima observacion reciente
 * encontro chinches y otro mas si la densidad viene en aumento.
 */
function nivelRiesgo(
  etapa: EtapaReferencia,
  observaciones: ObservacionReferencia[],
  hoy: string,
): { nivel: string; motivo: string } {
  const base = Math.max(0, NIVELES.indexOf(etapa.riesgoChinche as NivelRiesgo));
  const vigencia = frecuenciaEnDias(etapa.frecuenciaMonitoreo) ?? 7;
  const [ultima, anterior] = observaciones;

  if (!ultima || diasEntre(ultima.fecha, hoy) > vigencia * 2) {
    return {
      nivel: NIVELES[base],
      motivo: `Riesgo típico de la etapa ${etapa.nombre}; no hay observaciones recientes`,
    };
  }
  if (!ultima.presencia) {
    return {
      nivel: NIVELES[base],
      motivo: `Riesgo típico de la etapa ${etapa.nombre}; en el último monitoreo (${ultima.fecha}) no se encontraron chinches`,
    };
  }
  const enAumento =
    anterior?.presencia === true &&
    (ultima.densidad ?? 0) > (anterior.densidad ?? 0);
  const nivel = Math.min(NIVELES.length - 1, base + (enAumento ? 2 : 1));
  return {
    nivel: NIVELES[nivel],
    motivo: enAumento
      ? `Chinches presentes y en aumento: ${anterior.densidad ?? 0} → ${ultima.densidad ?? 0} cada 20 golpes de paño`
      : `Chinches presentes en el último monitoreo (${ultima.fecha}): ${ultima.densidad ?? 0} cada 20 golpes de paño`,
  };
}

/**
 * Ultima observacion + frecuencia de la etapa, corrida al primer dia apto del
 * pronostico. Sin observaciones, hoy. En etapas sin monitoreo, al inicio de la
 * siguiente etapa que lo requiera.
 */
function proximoMonitoreo(
  e: EntradaMonitoreo,
  etapa: EtapaReferencia,
  ventanas: VentanaEtapa[],
  dias: DiaMonitoreo[],
): { fecha: string; motivo: string; atrasado: boolean } {
  const frecuencia = frecuenciaEnDias(etapa.frecuenciaMonitoreo);
  let base: string;
  let motivo: string;
  let atrasado = false;

  if (frecuencia === null) {
    const siguiente = ventanas.find(
      (v) =>
        v.gddaMinimo > etapa.gddaMinimo &&
        frecuenciaEnDias(v.frecuenciaMonitoreo) !== null,
    );
    base = siguiente?.fechaInicioEstimada ?? e.hoy;
    motivo = siguiente
      ? `En ${etapa.nombre} no se recomienda monitorear; empezar al inicio estimado de ${siguiente.etapa}`
      : `En ${etapa.nombre} no se recomienda monitorear`;
  } else if (e.observaciones.length === 0) {
    base = e.hoy;
    motivo = `No hay monitoreos registrados en ${etapa.nombre} (${etapa.frecuenciaMonitoreo.toLowerCase()})`;
  } else {
    base = sumarDias(e.observaciones[0].fecha, frecuencia);
    motivo = `${etapa.frecuenciaMonitoreo} desde el último monitoreo (${e.observaciones[0].fecha})`;
    if (base < e.hoy) {
      base = e.hoy;
      atrasado = true;
      motivo = `Atrasado: ${motivo.charAt(0).toLowerCase()}${motivo.slice(1)}`;
    }
  }
  if (base < e.hoy) base = e.hoy;

  // Dentro del pronostico se busca el primer dia optimo, si no uno aceptable.
  const desde = dias.filter((d) => d.fecha >= base);
  const apto =
    desde.find((d) => d.calificacion === CalificacionDia.OPTIMA) ??
    desde.find((d) => d.calificacion === CalificacionDia.ACEPTABLE);
  if (apto && apto.fecha !== base) {
    return {
      fecha: apto.fecha,
      motivo: `${motivo}; se corre al ${apto.fecha} por el clima (${apto.motivo.toLowerCase()})`,
      atrasado,
    };
  }
  return { fecha: base, motivo, atrasado };
}

function alertas(
  e: EntradaMonitoreo,
  r: {
    etapaActual: EtapaReferencia;
    cicloCumplido: boolean;
    ventanasEtapas: VentanaEtapa[];
    fechasMonitoreo: DiaMonitoreo[];
    atrasado: boolean;
  },
): Alerta[] {
  const lista: Alerta[] = [];
  const critica = RIESGOS_CRITICOS.includes(r.etapaActual.riesgoChinche);
  const [ultima, anterior] = e.observaciones;

  if (r.cicloCumplido) {
    lista.push({
      tipo: 'CICLO_CUMPLIDO',
      nivel: NivelAlerta.INFO,
      mensaje: `El cultivo superó los grados día de ${r.etapaActual.nombre}: el monitoreo de chinche ya no es necesario`,
    });
    return lista;
  }
  if (critica) {
    lista.push({
      tipo: 'ETAPA_CRITICA',
      nivel: NivelAlerta.ADVERTENCIA,
      mensaje: `El cultivo está en ${r.etapaActual.nombre}, etapa de riesgo ${r.etapaActual.riesgoChinche.toLowerCase()} para la chinche: monitorear ${r.etapaActual.frecuenciaMonitoreo.toLowerCase()}`,
    });
  } else {
    const proxima = r.ventanasEtapas.find(
      (v) =>
        v.critica &&
        v.gddaMinimo > r.etapaActual.gddaMinimo &&
        v.fechaInicioEstimada !== null &&
        diasEntre(e.hoy, v.fechaInicioEstimada) <= 7,
    );
    if (proxima) {
      lista.push({
        tipo: 'ETAPA_CRITICA_PROXIMA',
        nivel: NivelAlerta.ADVERTENCIA,
        mensaje: `Se estima que el cultivo entra en ${proxima.etapa} (riesgo ${proxima.riesgoChinche.toLowerCase()}) alrededor del ${proxima.fechaInicioEstimada}`,
      });
    }
  }
  if (r.atrasado) {
    lista.push({
      tipo: 'MONITOREO_ATRASADO',
      nivel: critica ? NivelAlerta.CRITICA : NivelAlerta.ADVERTENCIA,
      mensaje: `El monitoreo está atrasado: el último fue el ${ultima.fecha}`,
    });
  }
  if (ultima?.presencia && critica) {
    lista.push({
      tipo: 'PRESENCIA_EN_ETAPA_CRITICA',
      nivel: NivelAlerta.CRITICA,
      mensaje: `Se encontraron ${ultima.densidad ?? 0} chinches cada 20 golpes de paño el ${ultima.fecha}, en etapa crítica: evaluar con el ingeniero si se supera el umbral de daño`,
    });
  }
  if (
    ultima?.presencia &&
    anterior?.presencia &&
    (ultima.densidad ?? 0) > (anterior.densidad ?? 0)
  ) {
    lista.push({
      tipo: 'DENSIDAD_EN_AUMENTO',
      nivel: NivelAlerta.ADVERTENCIA,
      mensaje: `La densidad subió de ${anterior.densidad ?? 0} a ${ultima.densidad ?? 0} chinches cada 20 golpes de paño`,
    });
  }
  const riesgosos = r.fechasMonitoreo.filter(
    (d) => d.calificacion === CalificacionDia.RIESGOSA,
  );
  if (riesgosos.length > 0) {
    lista.push({
      tipo: 'CLIMA_DESFAVORABLE',
      nivel: NivelAlerta.INFO,
      mensaje: `Días no aptos para monitorear por lluvia o viento: ${riesgosos.map((d) => d.fecha).join(', ')}`,
    });
  }
  return lista;
}
