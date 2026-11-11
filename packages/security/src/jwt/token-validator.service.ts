import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { RedisService } from '@petoman/infrastructure';

import { JwtPayload } from './jwt.types';

import { ERROR_CODES } from '../constants/error-code.constants';

@Injectable()
export class TokenValidatorService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async validate(token: string): Promise<JwtPayload> {
    let payload: JwtPayload;

    // Step 1: Verify the JWT.
    try {
      payload = this.jwtService.verify<JwtPayload>(
        token,
        {
          algorithms: ['RS256'],
          issuer: 'petoman-auth',
          audience: 'petoman-api',
        },
      );
    } catch {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Invalid or expired authentication token.',
      });
    }

    // Step 2: Ensure the token contains a session identifier.
    if (
      typeof payload.sid !== 'string' ||
      payload.sid.trim().length === 0
    ) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Invalid authentication session.',
      });
    }

    // Step 3: Check session revocation in Redis.
    try {
      const revoked = await this.redisService.exists(
        `auth:revoked-session:${payload.sid}`,
      );

      if (revoked) {
        throw new UnauthorizedException({
          code: ERROR_CODES.AUTH_UNAUTHORIZED,
          message: 'The authentication session has been revoked.',
        });
      }
    } catch (error) {
      // Preserve the rejection of an explicitly revoked session.
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Fail closed if Redis cannot validate the session.
      throw new ServiceUnavailableException({
        code: 'AUTH_SESSION_VALIDATION_UNAVAILABLE',
        message: 'Authentication session validation is temporarily unavailable.',
      });
    }

    return payload;
  }
}