
import { Module } from '@nestjs/common';

import {
  INTERNAL_JWT_OPTIONS,
  InternalJwtGuard,
  InternalJwtOptions,
  InternalJwtService,
} from '@petoman/security';

import { AuthModule } from '../auth/auth.module';
import { StorageController } from './storage.controller';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    {
      provide: InternalJwtGuard,
      useFactory: (
        internalJwtService: InternalJwtService,
        options: InternalJwtOptions,
      ) => new InternalJwtGuard(internalJwtService, options),
      inject: [InternalJwtService, INTERNAL_JWT_OPTIONS],
    },
  ],
})
export class AuthStorageModule {}
