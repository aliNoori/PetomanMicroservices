import { registerAs } from '@nestjs/config';

export default registerAs('internalJwt', () => ({
  secret: process.env.INTERNAL_JWT_SECRET!,
  issuer: process.env.INTERNAL_JWT_ISSUER!,

  authAudience: process.env.INTERNAL_JWT_AUTH_AUDIENCE!,
  marketAudience: process.env.INTERNAL_JWT_MARKET_AUDIENCE!,

  expiresInSeconds: Number(
    process.env.INTERNAL_JWT_EXPIRES_IN_SECONDS,
  ),
}));