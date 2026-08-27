import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtConfigModule } from '../../common/security/jwt.config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { UserEntity } from './entities/user.entity';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';

@Module({
  imports: [
    JwtConfigModule,
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

  providers: [AuthService],

  exports: [AuthService],
})
export class AuthModule {}
