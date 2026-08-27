import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  get port(): number {
    return this.configService.getOrThrow<number>('app.port');
  }

  get environment(): string {
    return this.configService.getOrThrow<string>(
      'app.environment',
    );
  }

  get database() {
    return {
      host: this.configService.getOrThrow<string>(
        'app.database.host',
      ),

      port: this.configService.getOrThrow<number>(
        'app.database.port',
      ),

      username: this.configService.getOrThrow<string>(
        'app.database.username',
      ),

      password: this.configService.getOrThrow<string>(
        'app.database.password',
      ),

      name: this.configService.getOrThrow<string>(
        'app.database.name',
      ),
    };
  }

  get redis() {
    return {
      host: this.configService.getOrThrow<string>(
        'app.redis.host',
      ),

      port: this.configService.getOrThrow<number>(
        'app.redis.port',
      ),
    };
  }
}