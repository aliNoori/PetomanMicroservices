import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { PermissionEntity } from './permission.entity';
import { RoleEntity } from './role.entity';

@Entity({
  name: 'role_permissions',
})
@Unique(
  'UQ_role_permissions_role_permission',
  ['roleId', 'permissionId'],
)
@Index(
  'IDX_role_permissions_permission_id',
  ['permissionId'],
)
export class RolePermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================
  // ROLE
  // ============================================================

  @Column({
    type: 'uuid',
    name: 'role_id',
  })
  roleId!: string;

  @ManyToOne(
    () => RoleEntity,
    (role) => role.rolePermissions,
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

  // ============================================================
  // PERMISSION
  // ============================================================

  @Column({
    type: 'uuid',
    name: 'permission_id',
  })
  permissionId!: string;

  @ManyToOne(
    () => PermissionEntity,
    (permission) => permission.rolePermissions,
    {
      nullable: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'permission_id',
  })
  permission!: PermissionEntity;

  // ============================================================
  // CREATED AT
  // ============================================================

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt!: Date;
}