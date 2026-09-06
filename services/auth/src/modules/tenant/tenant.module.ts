import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

import { TenantEntity } from '../auth/entities/tenant.entity';
import { TenantUserEntity } from '../auth/entities/tenant-user.entity';

import { TenantUserRepository } from '../auth/repositories/tenant-user-repository';

import { JwtConfigModule } from '../../common/security/jwt.config.module';
import {
  INTERNAL_JWT_OPTIONS,
  InternalJwtGuard,
  InternalJwtOptions,
  InternalJwtService,
} from '@petoman/security';
import { ConfigurationService } from '../../config/configuration.service';

@Module({
  imports: [
    JwtConfigModule,

    TypeOrmModule.forFeature([TenantEntity, TenantUserEntity]),
  ],

  controllers: [TenantController],

  providers: [
    TenantService,
    TenantUserRepository,
    InternalJwtService,

    {
      provide: INTERNAL_JWT_OPTIONS,
      inject: [ConfigurationService],
      useFactory: (
        configurationService: ConfigurationService,
      ): InternalJwtOptions => {
        return configurationService.internalJwt;
      },
    },

    {
      provide: InternalJwtGuard,
      useFactory: (
        internalJwtService: InternalJwtService,
        options: InternalJwtOptions,
      ) => {
        return new InternalJwtGuard(internalJwtService, options);
      },
      inject: [InternalJwtService, INTERNAL_JWT_OPTIONS],
    },
  ],

  exports: [TenantService],
})
export class TenantModule {}
