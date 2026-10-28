import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLoteDto {
  @ApiProperty({ maxLength: 120, example: 'Lote Norte 1' })
  @IsString()
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Superficie en hectareas',
    example: 120.5,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  superficie?: number;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-10-15',
    description:
      'Fecha de siembra. Necesaria para el monitoreo de chinche verde (grados dia)',
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'fechaSiembra debe tener formato YYYY-MM-DD' },
  )
  fechaSiembra?: string;

  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @IsPositive()
  provinciaId: number;

  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @IsPositive()
  campaniaId: number;
}
