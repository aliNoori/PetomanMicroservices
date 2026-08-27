import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { RolePermissionEntity } from './role-permission.entity';

@Entity({ name: 'permissions' })
@Unique('UQ_permissions_slug', ['slug'])
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  slug!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  description!: string | null;

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

  /**
   * Role <-> Permission
   *
   * Permission is global.
   * Tenant scope is determined by the Role,
   * not by the Permission.
   */
  @OneToMany(
    () => RolePermissionEntity,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions!: RolePermissionEntity[];
}