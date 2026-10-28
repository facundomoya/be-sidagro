import { ApiProperty } from '@nestjs/swagger';

// Clases solo para documentar en Swagger la respuesta de POST /auth/login.

class PermisoDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'SIMULACION_POST' })
  name: string;
}

class RolDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'INGENIERO', description: 'GERENTE o INGENIERO' })
  name: string;

  @ApiProperty({
    type: [PermisoDto],
    description: 'Permisos del rol: sirven para mostrar u ocultar opciones',
  })
  permission: PermisoDto[];
}

class UsuarioLogueadoDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'ingeniero1' })
  username: string;

  @ApiProperty({ example: 'ingeniero@sidagro.com' })
  email: string;

  @ApiProperty({ example: 'Juan' })
  name: string;

  @ApiProperty({ example: 'Perez' })
  lastname: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: RolDto, nullable: true })
  role: RolDto | null;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;
}

/** Forma real de la respuesta, envuelta por ResponseInterceptor. */
export class LoginRespuestaDto {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: UsuarioLogueadoDto })
  data: UsuarioLogueadoDto;
}
