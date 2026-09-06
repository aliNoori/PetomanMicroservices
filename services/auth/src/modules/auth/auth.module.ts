import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  INTERNAL_JWT_OPTIONS,
  InternalJwtGuard,
  InternalJwtOptions,
  InternalJwtService,
} from '@petoman/security';

import { JwtConfigModule } from '../../common/security/jwt.config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { UserEntity } from './entities/user.entity';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { TenantModule } from '../tenant/tenant.module';
import { ConfigurationService } from '../../config/configuration.service';

@Module({
  imports: [
    JwtConfigModule,
    TenantModule,
    TypeOrmModule.forFeature([
      TenantEntity,
      UserEntity,
      TenantUserEntity,
      RoleEntity,
      UserRoleEntity,
      PermissionEntity,
      RolePermissionEntity,
    ]),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,

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

  exports: [AuthService],
})
export class AuthModule {}
