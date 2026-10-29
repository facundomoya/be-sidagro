import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCostoDto {
  @ApiProperty({
    description:
      'Costo total por hectarea en US$/ha (directos e indirectos, sin Impuesto a las Ganancias)',
    example: 925,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costoPorHectarea: number;

  @ApiProperty({
    format: 'date',
    example: '2026-10-01',
    description:
      'Desde cuando rige; reemplaza al costo anterior desde esa fecha',
  })
  @IsDateString(
    { strict: true },
    { message: 'vigenciaDesde debe tener formato YYYY-MM-DD' },
  )
  vigenciaDesde: string;

  @ApiPropertyOptional({
    maxLength: 255,
    example: 'Costos totales directos e indirectos de soja, oct/26',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fuente?: string;

  @ApiPropertyOptional({
    maxLength: 2000,
    example: 'Suben laboreos, cosecha y fletes por el gasoil',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detalle?: string;
}
