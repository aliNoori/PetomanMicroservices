import { registerAs } from '@nestjs/config';

export interface AppConfig {
  readonly environment: string;
  readonly port: number;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3001),
  }),
);