import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

import { TenantEntity } from '../auth/entities/tenant.entity';
import { TenantUserEntity } from '../auth/entities/tenant-user.entity';

import { TenantUserRepository } from '../auth/repositories/tenant-user-repository';

import { JwtConfigModule } from '../../common/security/jwt.config.module';

@Module({
  imports: [
    JwtConfigModule,

    TypeOrmModule.forFeature([
      TenantEntity,
      TenantUserEntity,
    ]),
  ],

  controllers: [
    TenantController,
  ],

  providers: [
    TenantService,
    TenantUserRepository,
  ],

  exports: [
    TenantService,
  ],
})
export class TenantModule {}