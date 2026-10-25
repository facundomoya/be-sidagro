import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'SIMULACION_POST' })
  @IsString()
  @IsNotEmpty()
  name!: string;
  @ApiProperty()
  @IsString()
  description!: string;
}
