import { ApiProperty } from '@nestjs/swagger';
import { NivelRiesgo } from '../enums/agro.enums';
import { CalificacionDia, NivelAlerta } from '../monitoreo/calculo-monitoreo';
import { EstadoCieloDto } from './pronostico-response.dto';

// Clases solo para documentar en Swagger las respuestas de /agro/monitoreo.

export class ObservacionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2026-10-27', format: 'date' })
  fecha: string;

  @ApiProperty({ example: true, description: 'true = Presente' })
  presencia: boolean;

  @ApiProperty({
    nullable: true,
    example: 3,
    description: 'Chinches cada 20 golpes de paño',
  })
  densidad: number | null;

  @ApiProperty({ nullable: true, example: 'Adultos en el borde norte' })
  observaciones: string | null;

  @ApiProperty({
    nullable: true,
    example: '812.40',
    description: 'GDDA al dia del monitoreo (texto decimal)',
  })
  gddaAcumulado: string | null;

  @ApiProperty({ nullable: true, example: 'R3 - Formación de vainas' })
  etapaEstimada: string | null;

  @ApiProperty({ example: '2026-10-27T20:40:12.000Z' })
  createdAt: string;
}

class LoteMonitoreoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Lote Norte 1' })
  nombre: string;

  @ApiProperty({ example: '2026-08-01', format: 'date' })
  fechaSiembra: string;

  @ApiProperty({ example: 'San Luis' })
  provincia: string;

  @ApiProperty({ nullable: true, example: 'General Pedernera' })
  departamento: string | null;

  @ApiProperty({ example: '2026/2027' })
  campania: string;
}

class EtapaActualDto {
  @ApiProperty({ example: 4 })
  id: number;

  @ApiProperty({ example: 'R3 - Formación de vainas' })
  nombre: string;

  @ApiProperty({ example: 750 })
  gddaMinimo: number;

  @ApiProperty({ example: 900 })
  gddaMaximo: number;

  @ApiProperty({ example: 'Cada 3 días' })
  frecuenciaMonitoreo: string;

  @ApiProperty({ example: 'Alto' })
  riesgoChinche: string;
}

class VentanaEtapaDto {
  @ApiProperty({ example: 'R3 - Formación de vainas' })
  etapa: string;

  @ApiProperty({ example: 'Alto' })
  riesgoChinche: string;

  @ApiProperty({ example: 'Cada 3 días' })
  frecuenciaMonitoreo: string;

  @ApiProperty({ example: 750 })
  gddaMinimo: number;

  @ApiProperty({ example: 900 })
  gddaMaximo: number;

  @ApiProperty({
    nullable: true,
    example: '2026-10-20',
    description: 'Real si ya paso, proyectada si no; null si queda muy lejos',
  })
  fechaInicioEstimada: string | null;

  @ApiProperty({ nullable: true, example: '2026-11-04' })
  fechaFinEstimada: string | null;

  @ApiProperty({
    example: true,
    description: 'Riesgo Alto o Muy alto: periodo critico para monitorear',
  })
  critica: boolean;
}

class DiaMonitoreoDto {
  @ApiProperty({ example: '2026-10-28', format: 'date' })
  fecha: string;

  @ApiProperty({ example: 845.2 })
  gddaProyectado: number;

  @ApiProperty({ example: 'R3 - Formación de vainas' })
  etapa: string;

  @ApiProperty({
    enum: CalificacionDia,
    example: CalificacionDia.OPTIMA,
    description:
      'OPTIMA: sin lluvia y poco viento. ACEPTABLE: lluvia leve o viento de 15-25 km/h. RIESGOSA: lluvia de 5 mm o mas, o viento de mas de 25 km/h',
  })
  calificacion: CalificacionDia;

  @ApiProperty({ example: 'Sin lluvia y con poco viento' })
  motivo: string;

  @ApiProperty({ example: 17.2 })
  temperatura: number;

  @ApiProperty({ example: 0 })
  precipitacion: number;

  @ApiProperty({ example: 12.4 })
  viento: number;

  @ApiProperty({ example: 60 })
  humedad: number;

  @ApiProperty({ nullable: true, example: 10 })
  probabilidadLluvia: number | null;

  @ApiProperty({ type: EstadoCieloDto })
  estadoCielo: EstadoCieloDto;
}

class ProximoMonitoreoDto {
  @ApiProperty({ example: '2026-10-28', format: 'date' })
  fecha: string;

  @ApiProperty({
    example: 'Cada 3 días desde el último monitoreo (2026-10-25)',
  })
  motivo: string;
}

class AlertaDto {
  @ApiProperty({
    example: 'ETAPA_CRITICA',
    description:
      'ETAPA_CRITICA, ETAPA_CRITICA_PROXIMA, MONITOREO_ATRASADO, PRESENCIA_EN_ETAPA_CRITICA, DENSIDAD_EN_AUMENTO, CLIMA_DESFAVORABLE o CICLO_CUMPLIDO',
  })
  tipo: string;

  @ApiProperty({ enum: NivelAlerta, example: NivelAlerta.ADVERTENCIA })
  nivel: NivelAlerta;

  @ApiProperty({
    example:
      'El cultivo está en R3 - Formación de vainas, etapa de riesgo alto para la chinche: monitorear cada 3 días',
  })
  mensaje: string;
}

class UbicacionClimaDto {
  @ApiProperty({
    enum: ['DEPARTAMENTO', 'CAPITAL'],
    example: 'DEPARTAMENTO',
    description:
      'CAPITAL: el lote no tiene departamento y se usa el clima de la capital provincial',
  })
  origen: string;

  @ApiProperty({ example: 'Copo' })
  nombre: string;

  @ApiProperty({ example: -25.939161 })
  latitud: number;

  @ApiProperty({ example: -62.731097 })
  longitud: number;
}

export class MonitoreoDto {
  @ApiProperty({ type: LoteMonitoreoDto })
  lote: LoteMonitoreoDto;

  @ApiProperty({ example: '2026-10-27', description: 'Hoy (Argentina)' })
  fecha: string;

  @ApiProperty({ example: 10, description: 'Temperatura base de la soja (°C)' })
  temperaturaBase: number;

  @ApiProperty({ example: 'Open-Meteo' })
  proveedorClimatico: string;

  @ApiProperty({
    type: UbicacionClimaDto,
    description: 'Donde se pidio el clima (temperaturas y pronostico)',
  })
  ubicacionClima: UbicacionClimaDto;

  @ApiProperty({ example: 87 })
  diasDesdeSiembra: number;

  @ApiProperty({ example: 8.6, description: 'GDD de hoy' })
  gddHoy: number;

  @ApiProperty({ example: 812.4, description: 'GDDA desde la siembra' })
  gddaAcumulado: number;

  @ApiProperty({ type: EtapaActualDto, description: 'Estimada por el GDDA' })
  etapaActual: EtapaActualDto;

  @ApiProperty({ example: false, description: 'Supero los GDDA de R8' })
  cicloCumplido: boolean;

  @ApiProperty({ enum: NivelRiesgo, example: NivelRiesgo.MUY_ALTO })
  nivelRiesgo: NivelRiesgo;

  @ApiProperty({
    example:
      'Chinches presentes en el último monitoreo (2026-10-25): 3 cada 20 golpes de paño',
  })
  motivoRiesgo: string;

  @ApiProperty({ type: ProximoMonitoreoDto })
  proximoMonitoreo: ProximoMonitoreoDto;

  @ApiProperty({
    type: [DiaMonitoreoDto],
    description: 'Proximos 7 dias calificados para monitorear',
  })
  fechasMonitoreo: DiaMonitoreoDto[];

  @ApiProperty({
    type: [VentanaEtapaDto],
    description: 'Todas las etapas con su fecha estimada',
  })
  ventanasEtapas: VentanaEtapaDto[];

  @ApiProperty({ type: [AlertaDto] })
  alertas: AlertaDto[];

  @ApiProperty({ type: ObservacionDto, nullable: true })
  ultimaObservacion: ObservacionDto | null;
}

/** Formas reales de las respuestas, envueltas por ResponseInterceptor. */
export class MonitoreoRespuestaDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Information successfully retrieved' })
  message: string;

  @ApiProperty({ type: MonitoreoDto })
  data: MonitoreoDto;
}

export class ObservacionRespuestaDto {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Creation successful' })
  message: string;

  @ApiProperty({ type: ObservacionDto })
  data: ObservacionDto;
}

export class ObservacionesRespuestaDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Information successfully retrieved' })
  message: string;

  @ApiProperty({
    type: [ObservacionDto],
    description: 'De la mas reciente a la mas vieja',
  })
  data: ObservacionDto[];
}

class PaginaObservaciones {
  @ApiProperty({ type: [ObservacionDto] })
  data: ObservacionDto[];

  @ApiProperty({ example: 23 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

/** Respuesta cuando se manda page o limit. */
export class ObservacionesPaginadasRespuestaDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Information successfully retrieved' })
  message: string;

  @ApiProperty({
    type: PaginaObservaciones,
    description: 'De la mas reciente a la mas vieja',
  })
  data: PaginaObservaciones;
}
