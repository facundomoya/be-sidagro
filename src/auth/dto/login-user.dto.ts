import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ minLength: 4 })
  @IsString()
  @MinLength(4)
  username: string;
  @ApiProperty({ minLength: 6, format: 'password' })
  @IsString()
  @MinLength(6)
  password: string;
}
