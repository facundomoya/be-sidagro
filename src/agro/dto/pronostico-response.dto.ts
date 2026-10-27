import { ApiProperty } from '@nestjs/swagger';
import { IconoClima } from '../clima/estado-cielo';

// Clases solo para documentar en Swagger la respuesta de GET /agro/clima/pronostico.

export class EstadoCieloDto {
  @ApiProperty({
    nullable: true,
    example: 81,
    description: 'Codigo WMO del proveedor',
  })
  codigo: number | null;

  @ApiProperty({ example: 'Chaparrones moderados' })
  descripcion: string;

  @ApiProperty({
    enum: IconoClima,
    example: IconoClima.CHAPARRONES,
    description: 'Clave para elegir la imagen en el front',
  })
  icono: IconoClima;
}

export class DiaPronosticoDto {
  @ApiProperty({ example: '2026-10-29', format: 'date' })
  fecha: string;

  @ApiProperty({ example: 19.8, description: 'Temperatura media (°C)' })
  temperatura: number;

  @ApiProperty({ example: 15.7, description: 'Lluvia acumulada (mm)' })
  precipitacion: number;

  @ApiProperty({ example: 80, description: 'Humedad relativa media (%)' })
  humedad: number;

  @ApiProperty({ example: 9.9, description: 'Viento maximo (km/h)' })
  viento: number;

  @ApiProperty({
    nullable: true,
    example: 86,
    description: 'Probabilidad maxima de lluvia (%)',
  })
  probabilidadLluvia: number | null;

  @ApiProperty({ type: EstadoCieloDto })
  estadoCielo: EstadoCieloDto;
}

export class PronosticoDto {
  @ApiProperty({ example: 'Open-Meteo' })
  proveedor: string;

  @ApiProperty({ example: 'Santiago del Estero' })
  provincia: string;

  @ApiProperty({ example: -27.7951 })
  latitud: number;

  @ApiProperty({ example: -64.2615 })
  longitud: number;

  @ApiProperty({ type: [DiaPronosticoDto] })
  dias: DiaPronosticoDto[];
}

/** Forma real de la respuesta, envuelta por ResponseInterceptor. */
export class PronosticoRespuestaDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Information successfully retrieved' })
  message: string;

  @ApiProperty({ type: PronosticoDto })
  data: PronosticoDto;
}
