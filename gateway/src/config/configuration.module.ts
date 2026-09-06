import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigurationService } from './configuration.service';
import internalJwtConfig from './internal-jwt.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(internalJwtConfig),
  ],

  providers: [
    ConfigurationService,
  ],

  exports: [
    ConfigurationService,
  ],
})
export class ConfigurationModule {}