import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Roles } from '../../auth/enums/roles.enum';

export class addPermissionsDto {
  @ApiProperty({ type: [Number], description: 'IDs de permisos' })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class CreateRoleDto {
  @ApiProperty({ enum: Roles })
  @IsString({ message: 'Role name must be a string' })
  @IsEnum(Roles, { message: 'Role name must be a valid role' })
  name: string;
  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsOptional()
  permissions?: number[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'Enabled must be a boolean' })
  enabled?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'User ID must be a number' })
  userId?: number;
}
