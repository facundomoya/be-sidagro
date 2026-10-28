import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EstadoSimulacion,
  FuenteClimatica,
  NivelRiesgo,
} from '../enums/agro.enums';
import {
  NivelConfianza,
  Prioridad,
} from '../recomendacion/recommendation-provider.interface';

// Clases solo para documentar en Swagger la respuesta de /agro/simulaciones.

export class FuenteConsultadaDto {
  @ApiProperty({ example: 'Chinches en Soja Engormix.pdf' })
  titulo: string;

  @ApiProperty({ example: 'pág. 3' })
  referencia: string;
}

export class RecomendacionDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({
    example:
      'El lote en etapa R3 presenta riesgo alto de chinches, con observaciones en el borde y clima adverso para aplicar en los próximos días.',
  })
  resumen: string;

  @ApiProperty({
    example: 'La etapa R3 es crítica para el ataque de chinches...',
  })
  analisisDetallado: string;

  @ApiProperty({ example: 'En R3 los daños son más severos que en R5...' })
  analisisEtapaFenologica: string;

  @ApiProperty({
    example: 'Los vientos superiores a 15 km/h desde el 28/10...',
  })
  analisisClimatico: string;

  @ApiProperty({ example: 'La presencia en bordes sugiere migración...' })
  analisisSanitario: string;

  @ApiProperty({
    description:
      'Lo más importante: qué hacer, cuándo, dónde y con qué criterio',
    example:
      'Priorizar el monitoreo intensivo en los bordes del lote entre el 27 y el 30 de octubre...',
  })
  recomendacionPrincipal: string;

  @ApiProperty({ enum: NivelRiesgo, example: NivelRiesgo.ALTO })
  nivelRiesgo: NivelRiesgo;

  @ApiProperty({ enum: Prioridad, example: Prioridad.ALTA })
  prioridad: Prioridad;

  @ApiProperty({ enum: NivelConfianza, example: NivelConfianza.MEDIO })
  nivelConfianza: NivelConfianza;

  @ApiProperty({ type: [String] })
  factoresRiesgo: string[];

  @ApiProperty({ type: [String] })
  factoresAtenuantes: string[];

  @ApiProperty({ type: [String], description: 'Pasos ordenados con su fecha' })
  accionesSugeridas: string[];

  @ApiProperty({ type: [String] })
  datosFaltantes: string[];

  @ApiProperty({ type: [String] })
  advertencias: string[];

  @ApiProperty({
    type: [FuenteConsultadaDto],
    description:
      'Documentos y páginas en los que se basó (al menos uno con IA)',
  })
  fuentesConsultadas: FuenteConsultadaDto[];

  @ApiProperty({
    nullable: true,
    description: 'JSON completo devuelto por el generador, para auditoría',
  })
  respuestaOriginal: string | null;

  @ApiProperty({
    nullable: true,
    example: 'ministral-14b-latest',
    description: 'Modelo de IA o "reglas-locales"',
  })
  modeloIa: string | null;

  @ApiProperty({ nullable: true, example: '2026-10-27T20:19:10.000Z' })
  fechaGeneracion: string | null;
}

export class DatoClimaticoGuardadoDto {
  @ApiProperty({ example: 6 })
  id: number;

  @ApiProperty({ example: '2026-10-28', format: 'date' })
  fecha: string;

  @ApiProperty({ example: '17.20', description: 'Temperatura media (°C)' })
  temperatura: string;

  @ApiProperty({ example: '0.00', description: 'Precipitacion (mm)' })
  precipitacion: string;

  @ApiProperty({ example: '65.00', description: 'Humedad relativa (%)' })
  humedad: string;

  @ApiProperty({ example: '15.30', description: 'Viento maximo (km/h)' })
  viento: string;

  @ApiProperty({ enum: FuenteClimatica, example: FuenteClimatica.API })
  fuente: FuenteClimatica;

  @ApiProperty({ nullable: true, example: 'Open-Meteo' })
  proveedor: string | null;
}

export class SimulacionDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({
    enum: EstadoSimulacion,
    example: EstadoSimulacion.RECOMENDADA,
    description:
      'RECOMENDADA: tiene recomendacion. ERROR: la IA fallo; reintentar con POST /agro/simulaciones/:id/recomendacion',
  })
  estado: EstadoSimulacion;

  @ApiProperty({ enum: FuenteClimatica, example: FuenteClimatica.MANUAL })
  fuenteClimatica: FuenteClimatica;

  @ApiProperty({ enum: NivelRiesgo, example: NivelRiesgo.ALTO })
  riesgoPlaga: NivelRiesgo;

  @ApiProperty({ nullable: true, example: 'Chinches en el borde del lote' })
  observaciones: string | null;

  @ApiProperty({
    example: '750.00',
    description: 'Copia de la etapa al momento de simular',
  })
  gddaMinimoUtilizado: string;

  @ApiProperty({ example: '900.00' })
  gddaMaximoUtilizado: string;

  @ApiProperty({ example: 'Cada 3 días' })
  frecuenciaMonitoreoUtilizada: string;

  @ApiProperty({ example: 'Alto' })
  riesgoEtapaUtilizado: string;

  @ApiProperty({ description: 'Lote con provincia y campaña' })
  lote: object;

  @ApiProperty({ description: 'Etapa fenologica' })
  etapa: object;

  @ApiPropertyOptional({ description: 'Solo en el detalle' })
  usuario?: object;

  @ApiPropertyOptional({
    type: [DatoClimaticoGuardadoDto],
    description: 'Ordenados por fecha. Solo en el detalle',
  })
  datosClimaticos?: DatoClimaticoGuardadoDto[];

  @ApiPropertyOptional({
    type: RecomendacionDto,
    nullable: true,
    description: 'null si la simulacion quedo en ERROR. Solo en el detalle',
  })
  recomendacion?: RecomendacionDto | null;

  @ApiProperty({ example: '2026-10-27T20:18:55.698Z' })
  createdAt: string;
}

/** Forma real de la respuesta, envuelta por ResponseInterceptor. */
export class SimulacionRespuestaDto {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Creation successful' })
  message: string;

  @ApiProperty({ type: SimulacionDto })
  data: SimulacionDto;
}

export class PaginaSimulacionesDto {
  @ApiProperty({
    type: [SimulacionDto],
    description: 'Con lote, etapa y usuario; sin clima ni recomendacion',
  })
  data: SimulacionDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class SimulacionesRespuestaDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Information successfully retrieved' })
  message: string;

  @ApiProperty({ type: PaginaSimulacionesDto })
  data: PaginaSimulacionesDto;
}
