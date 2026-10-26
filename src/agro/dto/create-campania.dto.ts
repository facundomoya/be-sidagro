import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCampaniaDto {
  @ApiProperty({ maxLength: 120, example: '2026/2027' })
  @IsString()
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ format: 'date', example: '2026-10-01' })
  @IsDateString({ strict: true })
  fechaInicio: string;

  @ApiPropertyOptional({ format: 'date', example: '2027-05-31' })
  @IsOptional()
  @IsDateString({ strict: true })
  fechaFin?: string;
}
