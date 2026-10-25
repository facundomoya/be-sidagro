import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { Bcrypt } from '../common/bcrypt/bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserService,
    private readonly bcrypt: Bcrypt,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findByUsername(
      loginUserDto.username,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await this.bcrypt.compare(
      loginUserDto.password,
      user.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario dado de baja');
    }

    const { password, ...result } = user;

    return {
      ...result,
      token: this.getJwtToken({
        username: user.username,
        id: user.id,
        lastname: user.lastname,
        name: user.name,
        role: user.role
          ? {
              id: user.role.id,
              name: user.role.name,
              permissions:
                user.role.permission?.map((p) => ({
                  id: p.id,
                  name: p.name,
                })) ?? [],
            }
          : undefined,
      }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
