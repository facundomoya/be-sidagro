import { applyDecorators, UseGuards } from '@nestjs/common';
import { ValidPermissions } from '../enums/valid-permissions';
import { PermissionProtected } from './permission-protected.decorator';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { AuthGuard } from '@nestjs/passport';

export function Auth(...permissions: ValidPermissions[]) {
  return applyDecorators(
    PermissionProtected(...permissions),
    UseGuards(AuthGuard('jwt'), UserRoleGuard),
  );
}
