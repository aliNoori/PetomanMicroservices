import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

import { ConfigurationModule } from './config/configuration.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AppI18nModule } from './modules/i18n/i18n.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,

      load: [
        appConfig,
        databaseConfig,
      ],

      envFilePath: ['.env'],

      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),

        PORT: Joi.number()
          .port()
          .default(3001),

        DB_HOST: Joi.string()
          .default('127.0.0.1'),

        DB_PORT: Joi.number()
          .port()
          .default(5432),

        DB_USERNAME: Joi.string()
          .required(),

        DB_PASSWORD: Joi.string()
          .allow('')
          .required(),

        DB_NAME: Joi.string()
          .required(),

        REDIS_HOST: Joi.string()
          .default('127.0.0.1'),

        REDIS_PORT: Joi.number()
          .port()
          .default(6379),
      }),

      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,

        host: configService.getOrThrow<string>(
          'database.host',
        ),

        port: configService.getOrThrow<number>(
          'database.port',
        ),

        username: configService.getOrThrow<string>(
          'database.username',
        ),

        password: configService.getOrThrow<string>(
          'database.password',
        ),

        database: configService.getOrThrow<string>(
          'database.name',
        ),

        autoLoadEntities: true,

        synchronize: false,
      }),
    }),

    ConfigurationModule,

    AppI18nModule,

    HealthModule,

    AuthModule,
    
    TenantModule
  ],
})
export class AppModule {}