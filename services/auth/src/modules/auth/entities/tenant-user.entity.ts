import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  Column,
} from 'typeorm';

import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';

import { MEMBERSHIP_STATUS } from '../../../common/constants/membership.constants';

export type MembershipStatus =
  (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

@Entity('tenant_users')
@Unique('UQ_tenant_users_tenant_user', ['tenantId', 'userId'])
export class TenantUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================
  // Tenant
  // ============================================================

  @Column({
    name: 'tenant_id',
    type: 'uuid',
  })
  tenantId!: string;

  @ManyToOne(
    () => TenantEntity,
    (tenant) => tenant.memberships,
    {
      nullable: false,
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'tenant_id',
  })
  tenant!: TenantEntity;

  // ============================================================
  // User
  // ============================================================

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @ManyToOne(
    () => UserEntity,
    (user) => user.tenantMemberships,
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

  // ============================================================
  // Membership Status
  // ============================================================

  @Column({
    type: 'varchar',
    length: 20,
    default: MEMBERSHIP_STATUS.PENDING,
  })
  status!: MembershipStatus;

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