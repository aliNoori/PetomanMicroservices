import { Module } from '@nestjs/common';
import { RedisModule } from '@petoman/infrastructure';
import { HealthController } from './health.controller';

@Module({
  imports: [RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}