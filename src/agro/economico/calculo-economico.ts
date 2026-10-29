// Calculos del modulo economico (CU 04). Funciones puras: sin base ni APIs.
// Unidades: superficie en ha, rendimiento en t/ha, precio en US$/t y costo en US$/ha.

export enum ResultadoEconomico {
  GANANCIA = 'GANANCIA',
  PERDIDA = 'PERDIDA',
  EQUILIBRIO = 'EQUILIBRIO',
}

export interface EntradaEconomica {
  superficie: number | null;
  rendimiento: number | null;
  precio: number;
  costoPorHectarea: number;
}

export interface IndicadoresEconomicos {
  /** Toneladas que se esperan cosechar en todo el lote. */
  produccionEstimada: number;
  ingresoPorHectarea: number;
  costoPorHectarea: number;
  /** Ingreso menos costo por hectarea; negativo si se pierde. */
  gananciaPorHectarea: number;
  ingresoTotal: number;
  costoTotal: number;
  gananciaTotal: number;
  /** Ganancia sobre el costo, en porcentaje. */
  rentabilidad: number;
  resultado: ResultadoEconomico;
}

export interface AnalisisEconomico {
  /** null si falta algun dato del lote. */
  indicadores: IndicadoresEconomicos | null;
  /** Datos del lote que faltan para calcular (superficie, rendimiento). */
  faltantes: string[];
}

const redondear = (valor: number, decimales = 2) => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};

/**
 * Rendimiento de indiferencia: t/ha que hay que cosechar para cubrir los
 * costos al precio actual (los "costos en quintales" de los informes,
 * expresados en toneladas).
 */
export function rendimientoIndiferencia(
  costoPorHectarea: number,
  precio: number,
): number {
  return redondear(costoPorHectarea / precio);
}

export function calcularEconomia(e: EntradaEconomica): AnalisisEconomico {
  const faltantes: string[] = [];
  if (!e.superficie) faltantes.push('superficie');
  if (!e.rendimiento) faltantes.push('rendimiento');
  if (!e.superficie || !e.rendimiento) return { indicadores: null, faltantes };

  const ingresoPorHectarea = e.rendimiento * e.precio;
  const gananciaPorHectarea = ingresoPorHectarea - e.costoPorHectarea;
  const gananciaTotal = redondear(gananciaPorHectarea * e.superficie);

  let resultado = ResultadoEconomico.EQUILIBRIO;
  if (gananciaTotal > 0) resultado = ResultadoEconomico.GANANCIA;
  if (gananciaTotal < 0) resultado = ResultadoEconomico.PERDIDA;

  return {
    faltantes,
    indicadores: {
      produccionEstimada: redondear(e.rendimiento * e.superficie),
      ingresoPorHectarea: redondear(ingresoPorHectarea),
      costoPorHectarea: redondear(e.costoPorHectarea),
      gananciaPorHectarea: redondear(gananciaPorHectarea),
      ingresoTotal: redondear(ingresoPorHectarea * e.superficie),
      costoTotal: redondear(e.costoPorHectarea * e.superficie),
      gananciaTotal,
      rentabilidad: redondear((gananciaPorHectarea / e.costoPorHectarea) * 100),
      resultado,
    },
  };
}
