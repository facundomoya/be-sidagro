import { ApiProperty } from '@nestjs/swagger';

// Clases solo para documentar en Swagger las respuestas del modulo economico.
// Aca los importes llegan como numeros (no texto decimal), salvo en costos.

export class PrecioSojaDto {
  @ApiProperty({ example: '2026-10-27', format: 'date' })
  fecha: string;

  @ApiProperty({ example: 359.71, description: 'US$ por tonelada' })
  valor: number;

  @ApiProperty({ example: 'USD' })
  moneda: string;

  @ApiProperty({
    nullable: true,
    example: 550000,
    description: '$ por tonelada',
  })
  valorPesos: number | null;

  @ApiProperty({
    nullable: true,
    example: 1529,
    description: 'Dolar BNA comprador',
  })
  tipoCambio: number | null;

  @ApiProperty({ example: 'Pizarra Rosario (Camara Arbitral BCR)' })
  fuente: string;
}

export class PrecioVigenteDto extends PrecioSojaDto {
  @ApiProperty({
    example: false,
    description:
      'true si la pizarra no respondio y se usa el ultimo precio guardado',
  })
  desactualizado: boolean;

  @ApiProperty({ nullable: true, example: null })
  aviso: string | null;
}

export class CostoProduccionDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: '925.00', description: 'US$/ha (texto decimal)' })
  costoPorHectarea: string;

  @ApiProperty({ example: '2026-10-01', format: 'date' })
  vigenciaDesde: string;

  @ApiProperty({
    nullable: true,
    example: 'Costos totales directos e indirectos de soja, oct/26',
  })
  fuente: string | null;

  @ApiProperty({ nullable: true, example: null })
  detalle: string | null;
}

class LoteResumenDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'Lote Norte' })
  nombre: string;

  @ApiProperty({ nullable: true, example: 'San Luis' })
  provincia: string | null;

  @ApiProperty({ nullable: true, example: '2026/2027' })
  campania: string | null;

  @ApiProperty({ nullable: true, example: 80, description: 'Hectareas' })
  superficie: number | null;

  @ApiProperty({ nullable: true, example: 3.2, description: 't/ha' })
  rendimiento: number | null;
}

class IndicadoresDto {
  @ApiProperty({ example: 256, description: 'Toneladas de todo el lote' })
  produccionEstimada: number;

  @ApiProperty({ example: 1151.07, description: 'US$/ha' })
  ingresoPorHectarea: number;

  @ApiProperty({ example: 925, description: 'US$/ha' })
  costoPorHectarea: number;

  @ApiProperty({
    example: 226.07,
    description: 'US$/ha; negativo si se pierde',
  })
  gananciaPorHectarea: number;

  @ApiProperty({ example: 92085.76, description: 'US$' })
  ingresoTotal: number;

  @ApiProperty({ example: 74000, description: 'US$' })
  costoTotal: number;

  @ApiProperty({ example: 18085.76, description: 'US$' })
  gananciaTotal: number;

  @ApiProperty({ example: 24.44, description: 'Ganancia sobre costo, en %' })
  rentabilidad: number;

  @ApiProperty({ enum: ['GANANCIA', 'PERDIDA', 'EQUILIBRIO'] })
  resultado: string;
}

export class AnalisisLoteDto {
  @ApiProperty({ type: LoteResumenDto })
  lote: LoteResumenDto;

  @ApiProperty({
    type: IndicadoresDto,
    nullable: true,
    description: 'null si al lote le falta superficie o rendimiento',
  })
  indicadores: IndicadoresDto | null;

  @ApiProperty({
    type: [String],
    example: [],
    description: 'Datos que faltan: superficie, rendimiento',
  })
  faltantes: string[];
}

class AnalisisLoteCompletoDto extends AnalisisLoteDto {
  @ApiProperty({ type: PrecioVigenteDto })
  precioSoja: PrecioVigenteDto;

  @ApiProperty({ type: CostoProduccionDto })
  costoProduccion: CostoProduccionDto;

  @ApiProperty({
    example: 2.57,
    description: 't/ha necesarias para cubrir los costos al precio actual',
  })
  rendimientoIndiferencia: number;
}

class TotalesDto {
  @ApiProperty({ example: 3 })
  lotesCalculados: number;

  @ApiProperty({ example: 1 })
  lotesIncompletos: number;

  @ApiProperty({
    example: 250,
    description: 'Hectareas de los lotes calculados',
  })
  superficie: number;

  @ApiProperty({ example: 760, description: 'Toneladas' })
  produccionEstimada: number;

  @ApiProperty({ example: 273379.6 })
  ingresoTotal: number;

  @ApiProperty({ example: 231250 })
  costoTotal: number;

  @ApiProperty({ example: 42129.6 })
  gananciaTotal: number;

  @ApiProperty({ nullable: true, example: 18.22, description: '%' })
  rentabilidad: number | null;

  @ApiProperty({ example: 2 })
  lotesConGanancia: number;

  @ApiProperty({ example: 1 })
  lotesConPerdida: number;
}

class DashboardDto {
  @ApiProperty({ type: PrecioVigenteDto })
  precioSoja: PrecioVigenteDto;

  @ApiProperty({ type: CostoProduccionDto })
  costoProduccion: CostoProduccionDto;

  @ApiProperty({ example: 2.57, description: 't/ha para cubrir costos' })
  rendimientoIndiferencia: number;

  @ApiProperty({ type: TotalesDto })
  totales: TotalesDto;

  @ApiProperty({ type: [AnalisisLoteDto], description: 'Ordenados por nombre' })
  lotes: AnalisisLoteDto[];

  @ApiProperty({
    type: [String],
    example: [
      '1 lote(s) sin superficie o rendimiento no se incluyen en los totales.',
    ],
  })
  avisos: string[];
}

/** Formas reales de las respuestas, envueltas por ResponseInterceptor. */
class Respuesta {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Information successfully retrieved' })
  message: string;
}

export class PrecioVigenteRespuestaDto extends Respuesta {
  @ApiProperty({ type: PrecioVigenteDto })
  data: PrecioVigenteDto;
}

export class PreciosRespuestaDto extends Respuesta {
  @ApiProperty({
    type: [PrecioSojaDto],
    description:
      'Del mas reciente al mas viejo. Con page o limit: { data, total, page, limit, totalPages }',
  })
  data: PrecioSojaDto[];
}

export class CostosRespuestaDto extends Respuesta {
  @ApiProperty({
    type: [CostoProduccionDto],
    description: 'Del mas reciente al mas viejo',
  })
  data: CostoProduccionDto[];
}

export class CostoRespuestaDto extends Respuesta {
  @ApiProperty({ type: CostoProduccionDto })
  data: CostoProduccionDto;
}

export class AnalisisLoteRespuestaDto extends Respuesta {
  @ApiProperty({ type: AnalisisLoteCompletoDto })
  data: AnalisisLoteCompletoDto;
}

export class DashboardRespuestaDto extends Respuesta {
  @ApiProperty({ type: DashboardDto })
  data: DashboardDto;
}
