import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { TenantEntity } from './tenant.entity';
import { UserRoleEntity } from './user-role.entity';
import { RolePermissionEntity } from './role-permission.entity';

@Entity('roles')
@Unique('UQ_roles_tenant_id_id', ['tenantId', 'id'])
@Index('IDX_roles_tenant_slug_unique', ['tenantId', 'slug'], {
  unique: true,
  where: '"tenant_id" IS NOT NULL',
})
@Index('IDX_roles_system_slug_unique', ['slug'], {
  unique: true,
  where: '"is_system" = TRUE',
})
@Index('IDX_roles_tenant_id', ['tenantId'])
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================
  // Tenant Context
  // ============================================================

  /**
   * System role:
   *
   *   tenantId = null
   *   isSystem = true
   *
   * Tenant role:
   *
   *   tenantId = UUID
   *   isSystem = false
   */
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId!: string | null;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.roles, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'tenant_id',
  })
  tenant!: TenantEntity | null;

  // ============================================================
  // Identity
  // ============================================================

  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  slug!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  description!: string | null;

  // ============================================================
  // System Role
  // ============================================================

  @Column({
    name: 'is_system',
    type: 'boolean',
    default: false,
  })
  isSystem!: boolean;

  // ============================================================
  // User Assignments
  // ============================================================

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role)
  userRoles!: UserRoleEntity[];

  // ============================================================
  // Permissions
  // ============================================================

  @OneToMany(
    () => RolePermissionEntity,
    (rolePermission) => rolePermission.role,
  )
  rolePermissions!: RolePermissionEntity[];

  // ============================================================
  // Timestamps
  // ============================================================

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updatedAt!: Date;
}
