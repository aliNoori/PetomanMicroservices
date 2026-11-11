
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { TokenValidatorService } from './token-validator.service';

import type { AuthenticatedRequest } from '../types/auth-request.type';

import { ERROR_CODES } from '../constants/error-code.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenValidator: TokenValidatorService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Authentication is required.',
      });
    }

    const [scheme, token] = authorization.trim().split(/\s+/);

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !token
    ) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Invalid authorization header.',
      });
    }

    const payload = await this.tokenValidator.validate(token);

    request.user = payload;

    return true;
  }
}
