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
  @IsString({ message: 'Username must be a string' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  username: string;
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
  @IsString({ message: 'Name must be a string' })
  name: string;
  @IsString({ message: 'Lastname must be a string' })
  lastname: string;
  @IsString({ message: 'Type must be a string' })
  @IsOptional()
  type: string;
  @IsOptional()
  @IsBoolean({ message: 'Enabled must be a boolean' })
  enabled?: boolean;
  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  isActive?: boolean;
  @Type(() => Number)
  @IsInt({ message: 'Role ID must be an integer' })
  @Min(1, { message: 'Role ID must be a positive integer' })
  roleId: number;
}
