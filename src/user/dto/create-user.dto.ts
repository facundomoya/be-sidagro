import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ minLength: 4, example: 'jperez' })
  @IsString({ message: 'Username must be a string' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  username: string;
  @ApiProperty({ minLength: 6, format: 'password' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
  @ApiProperty({ example: 'jperez@empresa.com' })
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
  @ApiProperty({ example: 'Juan' })
  @IsString({ message: 'Name must be a string' })
  name: string;
  @ApiProperty({ example: 'Perez' })
  @IsString({ message: 'Lastname must be a string' })
  lastname: string;
  @ApiPropertyOptional()
  @IsString({ message: 'Type must be a string' })
  @IsOptional()
  type: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'Enabled must be a boolean' })
  enabled?: boolean;
  @ApiPropertyOptional({
    description: 'false = usuario Inactivo (no puede ingresar)',
  })
  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  isActive?: boolean;
  @ApiProperty({ minimum: 1, description: 'ID del rol (GERENTE o INGENIERO)' })
  @Type(() => Number)
  @IsInt({ message: 'Role ID must be an integer' })
  @Min(1, { message: 'Role ID must be a positive integer' })
  roleId: number;
}
