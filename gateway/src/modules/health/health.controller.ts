import { Controller, Get } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../common/constants/error-code.constants';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return {
      status: 'ok',
    };
  }

  @Get('language')
  checkLanguage(@I18nLang() language: string): { language: string } {
    return {
      language,
    };
  }

  @Get('test-auth-expired')
  testAuthExpired(): never {
    throw new HttpException(
      {
        code: ERROR_CODES.AUTH_TOKEN_EXPIRED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
