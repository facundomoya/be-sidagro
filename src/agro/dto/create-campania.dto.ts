import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCampaniaDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsDateString({ strict: true })
  fechaInicio: string;

  @IsOptional()
  @IsDateString({ strict: true })
  fechaFin?: string;
}
