
import { Module } from '@nestjs/common';

import {
  InternalJwtGuard,
  InternalJwtService,
  INTERNAL_JWT_OPTIONS,
  type InternalJwtOptions,
} from '@petoman/security';

import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';

import { StorageController } from './storage.controller';
import { ProductImageController } from './product-image.controller';

import { ProductImageService } from './product-image.service';
import { ProductImageUrlService } from './product-image-url.service';

@Module({
  imports: [
    AuthModule,
    TenantModule,
  ],
  controllers: [
    StorageController,
    ProductImageController,
  ],
  providers: [
    ProductImageService,
    ProductImageUrlService,
    {
      provide: InternalJwtGuard,
      useFactory: (
        internalJwtService: InternalJwtService,
        options: InternalJwtOptions,
      ) =>
        new InternalJwtGuard(
          internalJwtService,
          options,
        ),
      inject: [
        InternalJwtService,
        INTERNAL_JWT_OPTIONS,
      ],
    },
  ],
})
export class AuthStorageModule {}
