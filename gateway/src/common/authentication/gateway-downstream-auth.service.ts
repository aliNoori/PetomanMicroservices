import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ROLE_SLUGS } from '../constants/roles.constants';

import {
  InternalAuthScope,
  InternalJwtService,
  type InternalJwtOptions,
} from '@petoman/security';

import type { AuthenticatedRequest } from '@petoman/security';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../modules/proxy/routing/gateway-route.types';

@Injectable()
export class GatewayDownstreamAuthService {
  constructor(
    private readonly internalJwtService: InternalJwtService,
    private readonly configService: ConfigService,
  ) {}

  createAuthorizationHeader(
    target: GatewayTarget,
    authMode: GatewayAuthMode,
    request: AuthenticatedRequest,
  ): string {
    const options = this.getOptions(target);

    switch (authMode) {
      case GatewayAuthMode.JWT: {
        const userId = request.user?.sub;
        const sid = request.user?.sid;

        if (!userId || !sid) {
          throw new UnauthorizedException(
            'Authenticated user and session context are required.',
          );
        }

        const tenantId = request.user?.tenantId ?? undefined;

        const isGlobalScope = request.user?.roles?.includes(
          ROLE_SLUGS.SUPER_ADMIN,
        );

        const scope = isGlobalScope
          ? InternalAuthScope.GLOBAL
          : tenantId
            ? InternalAuthScope.TENANT
            : InternalAuthScope.NO_TENANT;

        const token = this.internalJwtService.signUserToken(
          userId,
          tenantId,
          sid,
          scope,
          options,
        );

        return `Bearer ${token}`;
      }

      case GatewayAuthMode.PUBLIC: {
        const token = this.internalJwtService.signServiceToken(options);

        return `Bearer ${token}`;
      }

      default: {
        const exhaustiveCheck: never = authMode;
        throw new Error(
          `Unsupported gateway authentication mode: ${exhaustiveCheck}`,
        );
      }
    }
  }

  private getOptions(target: GatewayTarget): InternalJwtOptions {
    const secret = this.configService.getOrThrow<string>('internalJwt.secret');

    const issuer = this.configService.getOrThrow<string>('internalJwt.issuer');

    const expiresInSeconds = this.configService.getOrThrow<number>(
      'internalJwt.expiresInSeconds',
    );

    switch (target) {
      case GatewayTarget.AUTH:
        return {
          secret,
          issuer,
          audience: this.configService.getOrThrow<string>(
            'internalJwt.authAudience',
          ),
          expiresInSeconds,
        };

      case GatewayTarget.MARKET:
        return {
          secret,
          issuer,
          audience: this.configService.getOrThrow<string>(
            'internalJwt.marketAudience',
          ),
          expiresInSeconds,
        };

      default:
        throw new Error(
          `Internal JWT configuration is not defined for target "${target}".`,
        );
    }
  }
}
