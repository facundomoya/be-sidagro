import { ApiProperty } from '@nestjs/swagger';

// Clases solo para documentar en Swagger las respuestas del catalogo agro.

export class ProvinciaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'San Luis' })
  nombre: string;

  @ApiProperty({
    example: '-33.301700',
    description: 'Coordenadas de la capital (texto decimal)',
  })
  latitud: string;

  @ApiProperty({ example: '-66.337800' })
  longitud: string;
}

export class EtapaFenologicaDto {
  @ApiProperty({ example: 4 })
  id: number;

  @ApiProperty({ example: 'R3 - Formación de vainas' })
  nombre: string;

  @ApiProperty({ example: 'Formación de vainas' })
  descripcion: string;

  @ApiProperty({ example: '750.00', description: 'Texto decimal' })
  gddaMinimo: string;

  @ApiProperty({ example: '900.00' })
  gddaMaximo: string;

  @ApiProperty({ example: 'Cada 3 días' })
  frecuenciaMonitoreo: string;

  @ApiProperty({ example: 'Alto', description: 'Riesgo base de chinche' })
  riesgoChinche: string;
}

export class CampaniaDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: '2026/2027' })
  nombre: string;

  @ApiProperty({ example: '2026-10-01', format: 'date' })
  fechaInicio: string;

  @ApiProperty({ nullable: true, example: '2027-05-31', format: 'date' })
  fechaFin: string | null;
}

export class LoteDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'Lote Norte' })
  nombre: string;

  @ApiProperty({ nullable: true, example: 'Ruta 7 km 12' })
  ubicacion: string | null;

  @ApiProperty({
    nullable: true,
    example: '80.00',
    description: 'Hectareas (texto decimal)',
  })
  superficie: string | null;

  @ApiProperty({
    nullable: true,
    example: '3.20',
    description: 'Rendimiento esperado en t/ha (texto decimal)',
  })
  rendimiento: string | null;

  @ApiProperty({
    nullable: true,
    example: '2026-04-09',
    format: 'date',
    description: 'Necesaria para el monitoreo de chinche verde',
  })
  fechaSiembra: string | null;

  @ApiProperty({ example: 'ACTIVO', enum: ['ACTIVO', 'INACTIVO'] })
  estado: string;

  @ApiProperty({ type: ProvinciaDto })
  provincia: ProvinciaDto;

  @ApiProperty({ type: CampaniaDto })
  campania: CampaniaDto;
}

/** Formas reales de las respuestas, envueltas por ResponseInterceptor. */
class Respuesta {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Information successfully retrieved' })
  message: string;
}

class ListaProvincias {
  @ApiProperty({ type: [ProvinciaDto] })
  data: ProvinciaDto[];
}

class ListaEtapas {
  @ApiProperty({
    type: [EtapaFenologicaDto],
    description: 'Ordenadas de Emergencia a R8',
  })
  data: EtapaFenologicaDto[];
}

class Pagina {
  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

class PaginaCampanias extends Pagina {
  @ApiProperty({ type: [CampaniaDto] })
  data: CampaniaDto[];
}

class PaginaLotes extends Pagina {
  @ApiProperty({ type: [LoteDto] })
  data: LoteDto[];
}

export class ProvinciasRespuestaDto extends Respuesta {
  @ApiProperty({ type: ListaProvincias })
  data: ListaProvincias;
}

export class EtapasRespuestaDto extends Respuesta {
  @ApiProperty({ type: ListaEtapas })
  data: ListaEtapas;
}

export class EtapaRespuestaDto extends Respuesta {
  @ApiProperty({ type: EtapaFenologicaDto })
  data: EtapaFenologicaDto;
}

export class CampaniasRespuestaDto extends Respuesta {
  @ApiProperty({
    type: PaginaCampanias,
    description: 'Con takeAll=true solo viene data',
  })
  data: PaginaCampanias;
}

export class CampaniaRespuestaDto extends Respuesta {
  @ApiProperty({ type: CampaniaDto })
  data: CampaniaDto;
}

export class LotesRespuestaDto extends Respuesta {
  @ApiProperty({
    type: PaginaLotes,
    description: 'Con takeAll=true solo viene data',
  })
  data: PaginaLotes;
}

export class LoteRespuestaDto extends Respuesta {
  @ApiProperty({ type: LoteDto })
  data: LoteDto;
}
