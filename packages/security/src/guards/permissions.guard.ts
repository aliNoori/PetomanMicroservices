import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from '../types/auth-request.type';

import {
  REQUIRED_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';


import {
  ERROR_CODES,
} from '../constants/error-code.constants';
import { PermissionSlug } from '../constants/permission.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<
        PermissionSlug[]
      >(
        REQUIRED_PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code:
          ERROR_CODES.AUTH_UNAUTHORIZED,
        message:
          'Authenticated user context is required.',
      });
    }

    const userPermissions =
      user.permissions ?? [];

    /*
     * OR semantics:
     *
     * If multiple permissions are declared,
     * having at least one is sufficient.
     */
    const hasRequiredPermission =
      requiredPermissions.some(
        (requiredPermission) =>
          userPermissions.includes(
            requiredPermission,
          ),
      );

    if (!hasRequiredPermission) {
      throw new ForbiddenException({
        code:
          ERROR_CODES.AUTH_PERMISSION_REQUIRED,
        message:
          'You do not have the required permission.',
      });
    }

    return true;
  }
}