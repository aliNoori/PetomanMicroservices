import { registerAs } from '@nestjs/config';

export default registerAs('internalJwt', () => ({
  secret: process.env.INTERNAL_JWT_SECRET,
  issuer: process.env.INTERNAL_JWT_ISSUER,
  audience: process.env.INTERNAL_JWT_AUDIENCE,
  expiresInSeconds: 60,
}));