import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from './jwt.types';

import { ERROR_CODES } from '../constants/error-code.constants';

@Injectable()
export class TokenValidatorService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  validate(
    token: string,
  ): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(
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
  }
}