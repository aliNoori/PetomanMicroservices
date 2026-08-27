import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from '../types/auth-request.type';

import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';

import {
  SYSTEM_ROLES,
  type AppRole,
} from '../constants/role.constants';

import { ERROR_CODES } from '../constants/error-code.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<AppRole[]>(
        REQUIRED_ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
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
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message:
          'Authenticated user context is required.',
      });
    }

    const userRoles = user.roles ?? [];

    const hasRequiredRole =
      requiredRoles.some(
        (requiredRole) => {
          // System role
          if (
            requiredRole ===
            SYSTEM_ROLES.SUPER_ADMIN
          ) {
            return userRoles.includes(
              SYSTEM_ROLES.SUPER_ADMIN,
            );
          }

          // Tenant-scoped roles require
          // an active tenant context.
          if (!user.tenantId) {
            return false;
          }

          /*
           * AuthService.selectTenant()
           * already resolved tenant-scoped roles
           * for the selected tenant.
           */
          return userRoles.includes(
            requiredRole,
          );
        },
      );

    if (!hasRequiredRole) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_ROLE_REQUIRED,
        message:
          'You do not have the required role.',
      });
    }

    return true;
  }
}