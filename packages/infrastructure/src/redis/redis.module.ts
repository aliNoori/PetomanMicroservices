import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { REDIS_CLIENT } from './redis.constants';
import { RedisClientProvider } from './redis-client.provider';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    RedisClientProvider,
    {
      provide: REDIS_CLIENT,
      inject: [RedisClientProvider],
      useFactory: (provider: RedisClientProvider) => provider.client,
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}