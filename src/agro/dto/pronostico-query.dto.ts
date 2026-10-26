import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { MAX_DIAS_CLIMATICOS } from '../enums/agro.enums';

export class PronosticoQueryDto {
  @ApiProperty({ minimum: 1, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  provinciaId: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_DIAS_CLIMATICOS,
    default: MAX_DIAS_CLIMATICOS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_DIAS_CLIMATICOS)
  dias?: number;
}
