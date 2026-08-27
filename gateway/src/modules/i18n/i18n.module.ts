import { Module } from '@nestjs/common';
import { I18nModule } from 'nestjs-i18n';
import { join } from 'node:path';

import { AcceptLanguageResolver } from './i18n.resolver';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',

      loaderOptions: {
        path: join(__dirname, 'locales'),
        watch: true,
      },

      resolvers: [AcceptLanguageResolver],
    }),
  ],
  providers: [AcceptLanguageResolver],
})
export class AppI18nModule {}