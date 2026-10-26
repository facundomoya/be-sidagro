/**
 * Clave estable de icono: el front la asocia a su propia imagen
 * (por ejemplo assets/clima/lluvia.svg), asi no depende de URLs externas.
 */
export enum IconoClima {
  DESPEJADO = 'despejado',
  PARCIALMENTE_NUBLADO = 'parcialmente-nublado',
  NUBLADO = 'nublado',
  NIEBLA = 'niebla',
  LLOVIZNA = 'llovizna',
  LLUVIA = 'lluvia',
  CHAPARRONES = 'chaparrones',
  NIEVE = 'nieve',
  TORMENTA = 'tormenta',
  DESCONOCIDO = 'desconocido',
}

export interface EstadoCielo {
  /** Codigo WMO original informado por el proveedor (null si no vino). */
  codigo: number | null;
  descripcion: string;
  icono: IconoClima;
}

// Codigos WMO 4677 que usa Open-Meteo. En el pronostico diario representan
// la condicion mas severa del dia.
const CODIGOS_WMO: Record<number, [string, IconoClima]> = {
  0: ['Despejado', IconoClima.DESPEJADO],
  1: ['Mayormente despejado', IconoClima.PARCIALMENTE_NUBLADO],
  2: ['Parcialmente nublado', IconoClima.PARCIALMENTE_NUBLADO],
  3: ['Nublado', IconoClima.NUBLADO],
  45: ['Niebla', IconoClima.NIEBLA],
  48: ['Niebla con escarcha', IconoClima.NIEBLA],
  51: ['Llovizna leve', IconoClima.LLOVIZNA],
  53: ['Llovizna moderada', IconoClima.LLOVIZNA],
  55: ['Llovizna intensa', IconoClima.LLOVIZNA],
  56: ['Llovizna helada leve', IconoClima.LLOVIZNA],
  57: ['Llovizna helada intensa', IconoClima.LLOVIZNA],
  61: ['Lluvia leve', IconoClima.LLUVIA],
  63: ['Lluvia moderada', IconoClima.LLUVIA],
  65: ['Lluvia intensa', IconoClima.LLUVIA],
  66: ['Lluvia helada leve', IconoClima.LLUVIA],
  67: ['Lluvia helada intensa', IconoClima.LLUVIA],
  71: ['Nevada leve', IconoClima.NIEVE],
  73: ['Nevada moderada', IconoClima.NIEVE],
  75: ['Nevada intensa', IconoClima.NIEVE],
  77: ['Granos de nieve', IconoClima.NIEVE],
  80: ['Chaparrones leves', IconoClima.CHAPARRONES],
  81: ['Chaparrones moderados', IconoClima.CHAPARRONES],
  82: ['Chaparrones violentos', IconoClima.CHAPARRONES],
  85: ['Chaparrones de nieve leves', IconoClima.NIEVE],
  86: ['Chaparrones de nieve intensos', IconoClima.NIEVE],
  95: ['Tormenta', IconoClima.TORMENTA],
  96: ['Tormenta con granizo leve', IconoClima.TORMENTA],
  99: ['Tormenta con granizo intenso', IconoClima.TORMENTA],
};

export function estadoCieloDesdeWmo(codigo: number | null): EstadoCielo {
  const conocido = codigo === null ? undefined : CODIGOS_WMO[codigo];
  if (!conocido) {
    return {
      codigo,
      descripcion: 'Sin informacion',
      icono: IconoClima.DESCONOCIDO,
    };
  }
  const [descripcion, icono] = conocido;
  return { codigo, descripcion, icono };
}
