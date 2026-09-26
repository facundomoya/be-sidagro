import { SetMetadata } from '@nestjs/common';

export const META_PERMISSION_PROTECTED = 'permission-protected';

export const PermissionProtected = (...args: string[]) => {
  return SetMetadata(META_PERMISSION_PROTECTED, args);
};
