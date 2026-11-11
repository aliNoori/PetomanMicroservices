import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

import { I18nLang } from 'nestjs-i18n';

import { RedisService } from '@petoman/infrastructure';

import { ERROR_CODES } from '../../common/constants/error-code.constants';

@Controller('health')
export class HealthController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  check(): { status: string } {
    return {
      status: 'ok',
    };
  }

  @Get('redis')
  async checkRedis(): Promise<{
    status: string;
    redis: string;
  }> {
    const isHealthy = await this.redisService.ping();

    return {
      status: isHealthy ? 'ok' : 'error',
      redis: isHealthy ? 'connected' : 'disconnected',
    };
  }

  @Get('language')
  checkLanguage(@I18nLang() language: string): {
    language: string;
  } {
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
