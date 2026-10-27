import { EstadoCielo } from './estado-cielo';

/** Variables climaticas de un dia, con el mismo formato que la carga manual. */
export interface DatoClimaticoDiario {
  fecha: string;
  temperatura: number;
  precipitacion: number;
  humedad: number;
  viento: number;
}

/**
 * Dia de pronostico normalizado. Ademas de las variables que se guardan en la
 * simulacion trae datos de presentacion para el front (icono, probabilidad).
 */
export interface PronosticoDiario extends DatoClimaticoDiario {
  probabilidadLluvia: number | null;
  estadoCielo: EstadoCielo;
}

/**
 * Fuente de datos climaticos. La simulacion depende solo de esta interfaz,
 * asi el proveedor (hoy Open-Meteo) se puede reemplazar sin tocarla.
 */
export interface ClimateProvider {
  readonly nombre: string;
  obtenerPronostico(
    latitud: number,
    longitud: number,
    dias: number,
  ): Promise<PronosticoDiario[]>;
}

export const CLIMATE_PROVIDER = Symbol('CLIMATE_PROVIDER');
