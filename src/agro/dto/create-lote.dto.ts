import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLoteDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ubicacion?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  superficie?: number;

  @IsInt()
  @IsPositive()
  provinciaId: number;

  @IsInt()
  @IsPositive()
  campaniaId: number;
}
