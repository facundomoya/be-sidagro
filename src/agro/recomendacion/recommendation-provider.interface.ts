import { NivelRiesgo } from '../enums/agro.enums';

export enum Prioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export enum NivelConfianza {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
}

export interface FuenteConsultada {
  titulo: string;
  referencia?: string;
}

/** Datos del escenario que recibe quien recomienda (reglas locales o IA). */
export interface ContextoEscenario {
  provincia: string;
  campania: string;
  lote: string;
  etapa: {
    nombre: string;
    gddaMinimo: number;
    gddaMaximo: number;
    frecuenciaMonitoreo: string;
    riesgoBase: string;
  };
  riesgoObservado: string;
  observaciones: string | null;
  fuenteClimatica: string;
  proveedorClimatico: string | null;
  clima: {
    fecha: string;
    temperatura: number;
    precipitacion: number;
    humedad: number;
    viento: number;
  }[];
}

/** Estructura que debe devolver cualquier proveedor; se valida antes de guardarla. */
export interface RecomendacionGenerada {
  resumen: string;
  analisisDetallado: string;
  analisisEtapaFenologica: string;
  analisisClimatico: string;
  analisisSanitario: string;
  factoresRiesgo: string[];
  factoresAtenuantes: string[];
  recomendacionPrincipal: string;
  accionesSugeridas: string[];
  datosFaltantes: string[];
  advertencias: string[];
  nivelRiesgo: NivelRiesgo;
  prioridad: Prioridad;
  nivelConfianza: NivelConfianza;
  fuentesConsultadas: FuenteConsultada[];
}

/**
 * Quien genera la recomendacion. La simulacion depende solo de esta interfaz:
 * hoy reglas locales, luego Gemini con File Search.
 */
export interface RecommendationProvider {
  /** Se guarda en recomendacion_agronomica.modeloIa. */
  readonly modelo: string;
  generar(contexto: ContextoEscenario): Promise<RecomendacionGenerada>;
}

export const RECOMMENDATION_PROVIDER = Symbol('RECOMMENDATION_PROVIDER');
