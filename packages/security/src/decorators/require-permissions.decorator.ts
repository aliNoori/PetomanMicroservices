import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_KEY =
  'auth:required_permissions';

export const RequirePermissions = (
  ...permissions: string[]
) =>
  SetMetadata(
    REQUIRED_PERMISSIONS_KEY,
    permissions,
  );