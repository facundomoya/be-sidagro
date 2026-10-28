import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginRespuestaDto } from './dto/login-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @ApiOperation({
    summary: 'Inicia sesion y devuelve el token JWT',
    description:
      'El token va en Authorization: Bearer <token> en el resto de los endpoints. Los permisos del rol vienen en data.role.',
  })
  @ApiCreatedResponse({ type: LoginRespuestaDto })
  @ApiUnauthorizedResponse({
    description: 'Credenciales invalidas o usuario dado de baja',
  })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }
}
