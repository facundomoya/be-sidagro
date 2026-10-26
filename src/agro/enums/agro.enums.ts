export enum FuenteClimatica {
  API = 'API',
  MANUAL = 'MANUAL',
}

// Mismos valores que etapa_fenologica.riesgoChinche, para poder comparar
// el riesgo base de la etapa con el riesgo observado por el ingeniero.
export enum NivelRiesgo {
  MUY_BAJO = 'Muy bajo',
  BAJO = 'Bajo',
  MODERADO = 'Moderado',
  ALTO = 'Alto',
  MUY_ALTO = 'Muy alto',
}

export enum EstadoSimulacion {
  CREADA = 'CREADA',
  RECOMENDADA = 'RECOMENDADA',
  ERROR = 'ERROR',
}

export const MAX_DIAS_CLIMATICOS = 7;
