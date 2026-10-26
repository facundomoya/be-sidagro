import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  FuenteClimatica,
  MAX_DIAS_CLIMATICOS,
  NivelRiesgo,
} from '../enums/agro.enums';

export class DatoClimaticoDto {
  @ApiProperty({ example: '2026-11-01', format: 'date' })
  @IsDateString(
    { strict: true },
    { message: 'fecha debe tener formato YYYY-MM-DD' },
  )
  fecha: string;

  @ApiProperty({
    description: 'Temperatura media (°C)',
    minimum: -30,
    maximum: 60,
    example: 27.5,
  })
  @IsNumber({}, { message: 'temperatura debe ser un numero (°C)' })
  @Min(-30)
  @Max(60)
  temperatura: number;

  @ApiProperty({
    description: 'Precipitacion (mm)',
    minimum: 0,
    maximum: 1000,
    example: 4.2,
  })
  @IsNumber({}, { message: 'precipitacion debe ser un numero (mm)' })
  @Min(0)
  @Max(1000)
  precipitacion: number;

  @ApiProperty({
    description: 'Humedad relativa (%)',
    minimum: 0,
    maximum: 100,
    example: 65,
  })
  @IsNumber({}, { message: 'humedad debe ser un numero (%)' })
  @Min(0)
  @Max(100)
  humedad: number;

  @ApiProperty({
    description: 'Velocidad del viento (km/h)',
    minimum: 0,
    maximum: 300,
    example: 12,
  })
  @IsNumber({}, { message: 'viento debe ser un numero (km/h)' })
  @Min(0)
  @Max(300)
  viento: number;
}

export class CreateSimulacionDto {
  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @IsPositive()
  loteId: number;

  @ApiProperty({
    minimum: 1,
    example: 4,
    description: 'Etapa fenologica seleccionada',
  })
  @IsInt()
  @IsPositive()
  etapaId: number;

  @ApiProperty({
    enum: FuenteClimatica,
    example: FuenteClimatica.MANUAL,
    description: 'API todavia no disponible (responde 501)',
  })
  @IsEnum(FuenteClimatica, {
    message: `fuenteClimatica debe ser ${Object.values(FuenteClimatica).join(' o ')}`,
  })
  fuenteClimatica: FuenteClimatica;

  @ApiPropertyOptional({
    type: [DatoClimaticoDto],
    minItems: 1,
    maxItems: MAX_DIAS_CLIMATICOS,
    description: `Obligatorio si fuenteClimatica es MANUAL. Serie diaria de hasta ${MAX_DIAS_CLIMATICOS} dias corridos, sin fechas repetidas.`,
  })
  @ValidateIf(
    (dto: CreateSimulacionDto) =>
      dto.fuenteClimatica === FuenteClimatica.MANUAL,
  )
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe informar al menos un dia climatico' })
  @ArrayMaxSize(MAX_DIAS_CLIMATICOS, {
    message: `La serie climatica admite hasta ${MAX_DIAS_CLIMATICOS} dias`,
  })
  @ValidateNested({ each: true })
  @Type(() => DatoClimaticoDto)
  datosClimaticos?: DatoClimaticoDto[];

  @ApiProperty({
    enum: NivelRiesgo,
    example: NivelRiesgo.MODERADO,
    description: 'Riesgo de plaga observado por el ingeniero',
  })
  @IsEnum(NivelRiesgo, {
    message: `riesgoObservado debe ser uno de: ${Object.values(NivelRiesgo).join(', ')}`,
  })
  riesgoObservado: NivelRiesgo;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}
