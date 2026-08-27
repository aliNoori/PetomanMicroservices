import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const i18n = app.get(I18nService);

  app.useGlobalFilters(
    new GlobalExceptionFilter(i18n),
  );

  const configurationService =
    app.get(ConfigurationService);

  await app.listen(configurationService.port);
}

void bootstrap();