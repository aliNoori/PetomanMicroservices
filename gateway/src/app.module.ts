import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import appConfig from './config/app.config';
import servicesConfig from './config/services.config';
import { ConfigurationModule } from './config/configuration.module';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { HealthModule } from './modules/health/health.module';
import { AppI18nModule } from './modules/i18n/i18n.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ProxyModule } from './modules/proxy/proxy.module';
import { JwtConfigModule } from './common/security/jwt.config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, servicesConfig],
      envFilePath: ['.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),

        PORT: Joi.number().integer().min(1).max(65535).default(3000),

        AUTH_SERVICE_PREFIX: Joi.string()
          .pattern(/^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/)
          .required(),

        AUTH_SERVICE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .required(),

        AUTH_SERVICE_TIMEOUT_MS: Joi.number()
          .integer()
          .min(100)
          .max(120000)
          .default(10000),

        FINANCIAL_SERVICE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .required(),

        FINANCIAL_SERVICE_PREFIX: Joi.string()
          .pattern(/^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/)
          .required(),

        FINANCIAL_SERVICE_TIMEOUT_MS: Joi.number()
          .integer()
          .min(100)
          .max(120000)
          .default(10000),

        VET_SERVICE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .required(),

        VET_SERVICE_PREFIX: Joi.string()
          .pattern(/^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/)
          .required(),

        VET_SERVICE_TIMEOUT_MS: Joi.number()
          .integer()
          .min(100)
          .max(120000)
          .default(10000),

        MARKET_SERVICE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .required(),

        MARKET_SERVICE_PREFIX: Joi.string()
          .pattern(/^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/)
          .required(),

        MARKET_SERVICE_TIMEOUT_MS: Joi.number()
          .integer()
          .min(100)
          .max(120000)
          .default(10000),

        PHARMACY_SERVICE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .required(),

        PHARMACY_SERVICE_PREFIX: Joi.string()
          .pattern(/^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/)
          .required(),

        PHARMACY_SERVICE_TIMEOUT_MS: Joi.number()
          .integer()
          .min(100)
          .max(120000)
          .default(10000),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    ConfigurationModule,
    HealthModule,
    AppI18nModule,
    ProxyModule,
    JwtConfigModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestIdMiddleware).forRoutes('*');
  }
}
