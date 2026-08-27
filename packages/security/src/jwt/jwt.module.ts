import { DynamicModule, Module } from "@nestjs/common";

import { JwtModule } from "@nestjs/jwt";

import { JwtAuthGuard } from "./jwt-auth.guard";
import { TokenValidatorService } from "./token-validator.service";
import { JwtTokenService } from './jwt-token.service';

export interface JwtSecurityOptions {
  publicKey: string;

  privateKey?: string;

  issuer: string;

  audience: string;
}

@Module({})
export class JwtSecurityModule {
  static register(options: JwtSecurityOptions): DynamicModule {
    return {
      module: JwtSecurityModule,

      imports: [
        JwtModule.register({
          publicKey: options.publicKey,

          privateKey: options.privateKey,

          signOptions: {
            algorithm: "RS256",

            issuer: options.issuer,

            audience: options.audience,

            expiresIn: "15m",
          },

          verifyOptions: {
            algorithms: ["RS256"],

            issuer: options.issuer,

            audience: options.audience,
          },
        }),
      ],

      providers: [TokenValidatorService, JwtAuthGuard,JwtTokenService,],

      exports: [TokenValidatorService, JwtAuthGuard,JwtTokenService,],
    };
  }
}
