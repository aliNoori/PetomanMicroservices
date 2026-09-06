import { NestFactory } from '@nestjs/core';

import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';

import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { marketProductsOpenApi } from './docs/openapi/market-products.openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(
    new ApiResponseInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle("Petoman API's")
    .setDescription(
      "Public API's documentation for the Petoman platform.",
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  document.components ??= {};
  document.components.schemas ??= {};

  Object.assign(
    document.components.schemas,
    marketProductsOpenApi.components.schemas,
  );

  Object.assign(
    document.paths,
    marketProductsOpenApi.paths,
  );

  SwaggerModule.setup(
    'api/docs',
    app,
    document,
  );

  await app.listen(
    process.env.PORT ?? 3000,
  );
}

bootstrap();