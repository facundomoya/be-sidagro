import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Observacion de campo del monitoreo de chinche verde (CU 06, pag. 38). */
export class CreateObservacionDto {
  @ApiProperty({
    example: '2026-10-27',
    format: 'date',
    description: 'Fecha del monitoreo (no futura ni anterior a la siembra)',
  })
  @IsDateString(
    { strict: true },
    { message: 'fecha debe tener formato YYYY-MM-DD' },
  )
  fecha: string;

  @ApiProperty({
    example: true,
    description: 'true = Presente, false = Ausente',
  })
  @IsBoolean({
    message: 'presencia debe ser true (presente) o false (ausente)',
  })
  presencia: boolean;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 1000,
    example: 3,
    description:
      'Chinches cada 20 golpes de paño. Obligatoria si presencia es true; se ignora si es false',
  })
  @IsOptional()
  @IsInt({ message: 'densidad debe ser un numero entero de chinches' })
  @Min(1)
  @Max(1000)
  densidad?: number;

  @ApiPropertyOptional({
    maxLength: 2000,
    example: 'Adultos en el borde norte',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}
