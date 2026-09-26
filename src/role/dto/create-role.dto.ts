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
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class CreateRoleDto {
  @IsString({ message: 'Role name must be a string' })
  @IsEnum(Roles, { message: 'Role name must be a valid role' })
  name: string;
  @IsArray()
  @IsOptional()
  permissions?: number[];
  @IsOptional()
  @IsBoolean({ message: 'Enabled must be a boolean' })
  enabled?: boolean;
  @IsOptional()
  @IsNumber({}, { message: 'User ID must be a number' })
  userId?: number;
}
