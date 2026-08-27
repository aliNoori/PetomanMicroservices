import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from './jwt.types';


@Injectable()
export class JwtTokenService {

  constructor(
    private readonly jwtService: JwtService,
  ) {}


  sign(
    payload: JwtPayload,
  ): string {

    return this.jwtService.sign(
      payload,
    );

  }


  verify(
    token: string,
  ): JwtPayload {

    return this.jwtService.verify<JwtPayload>(
      token,
      {
        algorithms: [
          'RS256',
        ],
      },
    );

  }

}