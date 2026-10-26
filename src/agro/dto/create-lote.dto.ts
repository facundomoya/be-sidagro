import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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

  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @IsPositive()
  provinciaId: number;

  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @IsPositive()
  campaniaId: number;
}
