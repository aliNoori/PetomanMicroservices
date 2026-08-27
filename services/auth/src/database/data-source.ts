import 'reflect-metadata';
import 'dotenv/config';

import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST ?? '127.0.0.1',

  port: Number(
    process.env.DB_PORT ?? 5432,
  ),

  username:
    process.env.DB_USERNAME ?? 'postgres',

  password:
    process.env.DB_PASSWORD ?? '',

  database:
    process.env.DB_NAME ?? 'petoman_auth',

  entities: [
    'dist/modules/**/entities/*.entity.js',
  ],

  migrations: [
    'dist/database/migrations/*.js',
  ],

  synchronize: false,
});
