import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLES_KEY =
  'auth:required_roles';

export const RequireRoles = (
  ...roles: string[]
) =>
  SetMetadata(
    REQUIRED_ROLES_KEY,
    roles,
  );