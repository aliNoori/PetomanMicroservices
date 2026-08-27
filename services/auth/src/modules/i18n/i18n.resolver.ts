import { Injectable, ExecutionContext } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';

@Injectable()
export class AcceptLanguageResolver implements I18nResolver {
  resolve(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();

    const acceptLanguage = request.headers['accept-language'];

    if (!acceptLanguage) {
      return undefined;
    }

    return acceptLanguage.split(',')[0]?.split('-')[0]?.trim();
  }
}