import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TenantEntity } from './tenant.entity';
import { TenantUserEntity } from './tenant-user.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 255,
  })
  email!: string;

  @Column({
    name: 'is_email_verified',
    type: 'boolean',
    default: false,
  })
  isEmailVerified!: boolean;

  @Column({
    name: 'email_verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  emailVerifiedAt!: Date | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
  })
  passwordHash!: string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  firstName!: string | null;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  lastName!: string | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  // ============================================================
  // Tenant Ownership
  // ============================================================

  @OneToMany(() => TenantEntity, (tenant) => tenant.owner)
  ownedTenants!: TenantEntity[];

  // ============================================================
  // Tenant Memberships
  // ============================================================

  @OneToMany(() => TenantUserEntity, (tenantUser) => tenantUser.user)
  tenantMemberships!: TenantUserEntity[];

  // ============================================================
  // Role Assignments
  // ============================================================

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles!: UserRoleEntity[];
}
