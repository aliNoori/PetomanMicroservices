import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';
import { TenantUserEntity } from './tenant-user.entity';
import { RoleEntity } from './role.entity';

import { TENANT_STATUS } from '../../../common/constants/tenant.constants';
import { UserRoleEntity } from './user-role.entity';

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

@Index('IDX_tenants_owner_id')
@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 150,
  })
  slug!: string;

  // ============================================================
  // Owner
  // ============================================================

  @Column({
    name: 'owner_id',
    type: 'uuid',
  })
  ownerId!: string;

  @ManyToOne(() => UserEntity, (user) => user.ownedTenants, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'owner_id',
  })
  owner!: UserEntity;

  // ============================================================
  // Status
  // ============================================================

  @Column({
    type: 'varchar',
    length: 20,
    default: TENANT_STATUS.PENDING,
  })
  status!: TenantStatus;

  // ============================================================
  // Review
  // ============================================================

  @Column({
    name: 'reviewed_at',
    type: 'timestamptz',
    nullable: true,
  })
  reviewedAt!: Date | null;

  @Column({
    name: 'reviewed_by',
    type: 'uuid',
    nullable: true,
  })
  reviewedBy!: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'reviewed_by',
  })
  reviewer!: UserEntity | null;

  @Column({
    name: 'rejection_reason',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  rejectionReason!: string | null;

  // ============================================================
  // Memberships
  // ============================================================

  @OneToMany(() => TenantUserEntity, (tenantUser) => tenantUser.tenant)
  memberships!: TenantUserEntity[];

  // ============================================================
  // Roles
  // ============================================================

  @OneToMany(() => RoleEntity, (role) => role.tenant)
  roles!: RoleEntity[];

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

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.tenant)
  userRoles!: UserRoleEntity[];
}
