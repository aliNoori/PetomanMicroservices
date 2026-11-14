import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import storageConfig from './config/storage.config';

import mailConfig from './config/mail.config';
import type { StorageConfig } from './config/storage.config';
import {
  MailModule,
  RedisModule,
  StorageModule,
} from '@petoman/infrastructure';

import { ConfigurationModule } from './config/configuration.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AppI18nModule } from './modules/i18n/i18n.module';
import internalJwtConfig from './config/internal-jwt.config';
import { AuthStorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,

      load: [
        appConfig,
        databaseConfig,
        internalJwtConfig,
        mailConfig,
        storageConfig,
      ],

      envFilePath: ['.env'],

      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),

        PORT: Joi.number().port().default(3001),

        DB_HOST: Joi.string().default('127.0.0.1'),

        DB_PORT: Joi.number().port().default(5432),

        DB_USERNAME: Joi.string().required(),

        DB_PASSWORD: Joi.string().allow('').required(),

        DB_NAME: Joi.string().required(),

        REDIS_HOST: Joi.string().default('127.0.0.1'),

        REDIS_PORT: Joi.number().port().default(6379),

        REDIS_DB: Joi.number().integer().min(0).default(0),

        REDIS_PASSWORD: Joi.string().allow('').optional(),

        MAIL_HOST: Joi.string().default('127.0.0.1'),

        MAIL_PORT: Joi.number().port().default(587),

        MAIL_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),

        MAIL_USER: Joi.string().allow('').default(''),

        MAIL_PASSWORD: Joi.string().allow('').default(''),

        MAIL_FROM: Joi.string().allow('').default(''),

        MAIL_VERIFICATION_URL: Joi.string()
          .uri()
          .default('http://localhost:5173/verify-email'),

        STORAGE_ENDPOINT: Joi.string().uri().default('http://127.0.0.1:9000'),

        STORAGE_REGION: Joi.string().default('us-east-1'),

        STORAGE_BUCKET: Joi.string().min(3).max(63).default('petoman-private'),

        STORAGE_ACCESS_KEY_ID: Joi.string().allow('').default(''),

        STORAGE_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),

        STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),

        STORAGE_FORCE_PATH_STYLE: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(true),

        STORAGE_SIGNED_URL_EXPIRES_IN_SECONDS: Joi.number()
          .integer()
          .min(1)
          .max(604800)
          .default(300),

        STORAGE_LOCAL_ROOT_DIRECTORY: Joi.string().min(1).default('./storage'),

        STORAGE_LOCAL_PUBLIC_BASE_URL: Joi.string()
          .uri()
          .default('http://localhost:3000'),

        STORAGE_LOCAL_SIGNING_SECRET: Joi.string().when('STORAGE_DRIVER', {
          is: 'local',
          then: Joi.string().min(32).required(),
          otherwise: Joi.string().allow('').default(''),
        }),
      }),

      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    RedisModule,

    MailModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.getOrThrow<string>('mail.host'),
        port: configService.getOrThrow<number>('mail.port'),
        secure: configService.getOrThrow<boolean>('mail.secure'),
        auth: {
          user: configService.getOrThrow<string>('mail.user'),
          pass: configService.getOrThrow<string>('mail.password'),
        },
        from: configService.getOrThrow<string>('mail.from'),
      }),
    }),

    StorageModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storage = configService.get<StorageConfig>('storage');

        if (!storage) {
          throw new Error('Storage configuration is missing.');
        }

        const commonOptions = {
          endpoint: storage.endpoint,
          region: storage.region,
          bucket: storage.bucket,
          accessKeyId: storage.accessKeyId,
          secretAccessKey: storage.secretAccessKey,
          forcePathStyle: storage.forcePathStyle,
          signedUrlExpiresInSeconds: storage.signedUrlExpiresInSeconds,
        };

        if (storage.driver === 'local') {
          return {
            driver: 'local' as const,
            ...commonOptions,
            rootDirectory: storage.localRootDirectory,
            publicBaseUrl: storage.localPublicBaseUrl,
            signingSecret: storage.localSigningSecret,
          };
        }

        return {
          driver: 's3' as const,
          ...commonOptions,
        };
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,

        host: configService.getOrThrow<string>('database.host'),

        port: configService.getOrThrow<number>('database.port'),

        username: configService.getOrThrow<string>('database.username'),

        password: configService.getOrThrow<string>('database.password'),

        database: configService.getOrThrow<string>('database.name'),

        autoLoadEntities: true,

        synchronize: false,
      }),
    }),

    ConfigurationModule,

    AppI18nModule,

    HealthModule,

    AuthModule,

    AuthStorageModule,

    TenantModule,
  ],
})
export class AppModule {}
