import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_PERMISSION_PROTECTED } from '../../decorators/permission-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] =
      this.reflector.get<string[]>(
        META_PERMISSION_PROTECTED,
        context.getHandler(),
      ) || [];
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return false;
    if (validRoles.length === 0) return true;
    const namePermissionUSer = user.role.permission.map(
      (permission) => permission.name,
    );
    if (validRoles.every((role) => namePermissionUSer.includes(role)))
      return true;
    return false;
  }
}
