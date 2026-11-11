import { Controller, Get, Headers } from '@nestjs/common';

import { RedisService } from '@petoman/infrastructure';

@Controller('auth/health')
export class HealthController {
  constructor(
    private readonly redisService: RedisService,
  ) {}

  @Get()
  check(): { status: string; data: string } {
    return {
      status: 'ok',
      data: 'Im Auth Service',
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

  @Get('slow')
  async slow(): Promise<{ status: string }> {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      status: 'ok',
    };
  }

  @Get('auth-header')
  authHeader(
    @Headers('authorization') authorization?: string,
  ): {
    authorization: string | null;
  } {
    return {
      authorization: authorization ?? null,
    };
  }
}