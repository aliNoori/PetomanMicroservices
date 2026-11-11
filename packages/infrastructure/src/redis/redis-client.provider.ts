import {
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import Redis from 'ioredis';

@Injectable()
export class RedisClientProvider implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisClientProvider.name);

  readonly client: Redis;

  constructor(configService: ConfigService) {
    const host = configService.getOrThrow<string>('REDIS_HOST');

    const port = Number(
      configService.getOrThrow<string>('REDIS_PORT'),
    );

    const db = Number(configService.get<string>('REDIS_DB', '0'));

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('REDIS_PORT must be a valid TCP port.');
    }

    if (!Number.isInteger(db) || db < 0) {
      throw new Error('REDIS_DB must be a non-negative integer.');
    }

    this.client = new Redis({
      host,
      port,
      db,
      password: configService.get<string>('REDIS_PASSWORD') || undefined,

      enableReadyCheck: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,

      connectTimeout: 10000,

      retryStrategy: (times: number): number => {
        return Math.min(times * 500, 5000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connection established.');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client is ready.');
    });

    this.client.on('reconnecting', (delay: number) => {
      this.logger.warn(`Redis reconnecting in ${delay}ms.`);
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed.');
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client.status === 'end') {
      return;
    }

    try {
      await this.client.quit();
      this.logger.log('Redis connection closed gracefully.');
    } catch (error) {
      this.logger.error('Failed to close Redis gracefully.');

      this.client.disconnect();

      if (error instanceof Error) {
        this.logger.error(error.message);
      }
    }
  }
}