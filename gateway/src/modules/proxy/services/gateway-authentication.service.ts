import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import {
  TokenValidatorService,
} from '@petoman/security';

import type { AuthenticatedRequest } from '@petoman/security';

import {
  ERROR_CODES,
} from '@petoman/security';

@Injectable()
export class GatewayAuthenticationService {
  constructor(
    private readonly tokenValidator:
      TokenValidatorService,
  ) {}

  authenticate(
    request: Request,
  ): void {
    const authorization =
      request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
      });
    }

    const [scheme, token] =
      authorization.trim().split(/\s+/);

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !token
    ) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
      });
    }

    const payload =
      this.tokenValidator.validate(token);

    const authenticatedRequest =
      request as AuthenticatedRequest;

    authenticatedRequest.user =
      payload;
  }
}