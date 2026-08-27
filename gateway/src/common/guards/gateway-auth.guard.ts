import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  TokenValidatorService,
  ERROR_CODES,
} from '@petoman/security';

import type { AuthenticatedRequest } from '@petoman/security';

@Injectable()
export class GatewayAuthGuard {
  constructor(
    private readonly tokenValidator:
      TokenValidatorService,
  ) {}

  authenticate(
    request: AuthenticatedRequest,
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

    request.user = payload;
  }
}