import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly name: string;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'petoman_auth',
  }),
);