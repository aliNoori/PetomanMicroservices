import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ERROR_CODES, type AuthenticatedRequest } from '@petoman/security';

import type { GatewayRoute } from '../../modules/proxy/routing/gateway-route.types';

@Injectable()
export class GatewayAuthorizationService {
  authorize(
    request: AuthenticatedRequest,
    route: GatewayRoute,
  ): void {
    const requiredPermissions =
      route.permissions ?? [];

    if (requiredPermissions.length === 0) {
      return;
    }

    const userPermissions =
      request.user.permissions ?? [];

    const hasPermission =
      requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

    if (!hasPermission) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_FORBIDDEN,
      });
    }
  }
}