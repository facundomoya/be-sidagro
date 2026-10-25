import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, Min } from 'class-validator';

export class QueryDto {
  [key: string]: any;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    default: false,
    description:
      'Devuelve todos los registros sin paginar. Ademas se puede filtrar por cualquier campo (campo=valor o campo__operador=valor).',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  takeAll?: boolean = false;
}
