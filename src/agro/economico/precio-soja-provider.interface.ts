/** Precio de la soja de un dia, tal como lo informa la fuente. */
export interface CotizacionSoja {
  /** Dia al que corresponde el precio (YYYY-MM-DD). */
  fecha: string;
  /** US$ por tonelada. */
  valor: number;
  /** Pesos por tonelada; null si la fuente no lo informa. */
  valorPesos: number | null;
  /** Pesos por dolar usado para convertir; null si la fuente no lo informa. */
  tipoCambio: number | null;
}

/** Fuente del precio de la soja. Permite cambiarla sin tocar el servicio. */
export interface PrecioSojaProvider {
  readonly nombre: string;
  /** Lanza ServiceUnavailableException si la fuente no responde o no se entiende. */
  obtenerPrecio(): Promise<CotizacionSoja>;
}

export const PRECIO_SOJA_PROVIDER = Symbol('PRECIO_SOJA_PROVIDER');
