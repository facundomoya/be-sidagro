import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: 3,
    description: 'Solo lotes de esta campania',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  campaniaId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Solo lotes de esta provincia',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  provinciaId?: number;
}
