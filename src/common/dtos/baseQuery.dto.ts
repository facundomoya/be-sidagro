import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, Min } from 'class-validator';

export class QueryDto {
  [key: string]: any;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  takeAll?: boolean = false;
}
