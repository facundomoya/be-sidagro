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
  @IsDateString(
    { strict: true },
    { message: 'fecha debe tener formato YYYY-MM-DD' },
  )
  fecha: string;

  @IsNumber({}, { message: 'temperatura debe ser un numero (°C)' })
  @Min(-30)
  @Max(60)
  temperatura: number;

  @IsNumber({}, { message: 'precipitacion debe ser un numero (mm)' })
  @Min(0)
  @Max(1000)
  precipitacion: number;

  @IsNumber({}, { message: 'humedad debe ser un numero (%)' })
  @Min(0)
  @Max(100)
  humedad: number;

  @IsNumber({}, { message: 'viento debe ser un numero (km/h)' })
  @Min(0)
  @Max(300)
  viento: number;
}

export class CreateSimulacionDto {
  @IsInt()
  @IsPositive()
  loteId: number;

  @IsInt()
  @IsPositive()
  etapaId: number;

  @IsEnum(FuenteClimatica, {
    message: `fuenteClimatica debe ser ${Object.values(FuenteClimatica).join(' o ')}`,
  })
  fuenteClimatica: FuenteClimatica;

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

  @IsEnum(NivelRiesgo, {
    message: `riesgoObservado debe ser uno de: ${Object.values(NivelRiesgo).join(', ')}`,
  })
  riesgoObservado: NivelRiesgo;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}
