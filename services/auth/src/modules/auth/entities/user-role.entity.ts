import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RoleEntity } from './role.entity';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_roles' })
@Index(
  'uq_user_roles_system',
  ['userId', 'roleId'],
  {
    unique: true,
    where: '"tenant_id" IS NULL',
  },
)
@Index(
  'uq_user_roles_tenant',
  ['userId', 'roleId', 'tenantId'],
  {
    unique: true,
    where: '"tenant_id" IS NOT NULL',
  },
)
export class UserRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================
  // USER
  // ============================================================

  @ManyToOne(
    () => UserEntity,
    (user) => user.userRoles,
    {
      nullable: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: UserEntity;

  @Column({
    type: 'uuid',
    name: 'user_id',
  })
  userId!: string;

  // ============================================================
  // ROLE
  // ============================================================

  @ManyToOne(
    () => RoleEntity,
    (role) => role.userRoles,
    {
      nullable: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'role_id',
  })
  role!: RoleEntity;

  @Column({
    type: 'uuid',
    name: 'role_id',
  })
  roleId!: string;

  // ============================================================
  // TENANT CONTEXT
  // ============================================================

  /**
   * NULL
   * ----
   * System-level role.
   *
   * Example:
   *
   * User -> SUPER_ADMIN
   * tenantId = null
   *
   * NON-NULL
   * --------
   * Tenant-scoped role.
   *
   * Example:
   *
   * User -> Tenant A -> TENANT_ADMIN
   * tenantId = Tenant A
   */

  @ManyToOne(
    () => TenantEntity,
    (tenant) => tenant.userRoles,
    {
      nullable: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'tenant_id',
  })
  tenant!: TenantEntity | null;

  @Column({
    type: 'uuid',
    name: 'tenant_id',
    nullable: true,
  })
  tenantId!: string | null;

  // ============================================================
  // CREATED AT
  // ============================================================

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt!: Date;
}