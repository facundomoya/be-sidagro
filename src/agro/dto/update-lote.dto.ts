import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateLoteDto } from './create-lote.dto';

/** Todos los campos son opcionales; la provincia y la campania no cambian. */
export class UpdateLoteDto extends PartialType(
  OmitType(CreateLoteDto, ['provinciaId', 'campaniaId'] as const),
) {
  @ApiPropertyOptional({ enum: ['ACTIVO', 'INACTIVO'], example: 'ACTIVO' })
  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO'])
  estado?: string;
}
