import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../../user/entities/user.entity';

/** Usuario autenticado que dejo JwtStrategy en request.user. Requiere @Auth(). */
export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const { user } = ctx.switchToHttp().getRequest<{ user?: User }>();
    if (!user) {
      throw new InternalServerErrorException(
        'GetUser usado en una ruta sin autenticacion',
      );
    }
    return user;
  },
);
