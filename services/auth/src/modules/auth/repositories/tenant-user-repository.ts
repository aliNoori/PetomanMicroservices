import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  MembershipStatus,
  TenantUserEntity,
} from '../entities/tenant-user.entity';

@Injectable()
export class TenantUserRepository {
  constructor(
    @InjectRepository(TenantUserEntity)
    private readonly repository: Repository<TenantUserEntity>,
  ) {}

  // ============================================================
  // FIND MEMBERSHIP
  // ============================================================

  async findMembership(
    tenantId: string,
    userId: string,
  ): Promise<TenantUserEntity | null> {
    return this.repository.findOne({
      where: {
        tenantId,
        userId,
      },
    });
  }

  // ============================================================
  // FIND ACTIVE MEMBERSHIP
  // ============================================================

  async findActiveMembership(
    tenantId: string,
    userId: string,
  ): Promise<TenantUserEntity | null> {
    return this.repository.findOne({
      where: {
        tenantId,
        userId,
        status: 'ACTIVE' as MembershipStatus,
      },
    });
  }

  // ============================================================
  // CHECK ACTIVE MEMBERSHIP
  // ============================================================

  async existsActiveMembership(
    tenantId: string,
    userId: string,
  ): Promise<boolean> {
    const membership =
      await this.findActiveMembership(
        tenantId,
        userId,
      );

    return membership !== null;
  }

  // ============================================================
  // FIND USER MEMBERSHIPS
  // ============================================================

  async findByUserId(
    userId: string,
  ): Promise<TenantUserEntity[]> {
    return this.repository.find({
      where: {
        userId,
      },
    });
  }

  // ============================================================
  // FIND TENANT MEMBERS
  // ============================================================

  async findByTenantId(
    tenantId: string,
  ): Promise<TenantUserEntity[]> {
    return this.repository.find({
      where: {
        tenantId,
      },
    });
  }

  // ============================================================
  // FIND PENDING MEMBERSHIPS
  // ============================================================

  async findPendingByTenantId(
    tenantId: string,
  ): Promise<TenantUserEntity[]> {
    return this.repository.find({
      where: {
        tenantId,
        status: 'PENDING' as MembershipStatus,
      },
    });
  }

  // ============================================================
  // FIND MEMBERSHIP BY STATUS
  // ============================================================

  async findByStatus(
    tenantId: string,
    status: MembershipStatus,
  ): Promise<TenantUserEntity[]> {
    return this.repository.find({
      where: {
        tenantId,
        status,
      },
    });
  }

  // ============================================================
  // CREATE MEMBERSHIP
  // ============================================================

  async create(
    data: Partial<TenantUserEntity>,
  ): Promise<TenantUserEntity> {
    const membership =
      this.repository.create(data);

    return this.repository.save(membership);
  }

  // ============================================================
  // SAVE MEMBERSHIP
  // ============================================================

  async save(
    membership: TenantUserEntity,
  ): Promise<TenantUserEntity> {
    return this.repository.save(membership);
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async updateStatus(
    tenantId: string,
    userId: string,
    status: MembershipStatus,
  ): Promise<TenantUserEntity | null> {
    const membership =
      await this.findMembership(
        tenantId,
        userId,
      );

    if (!membership) {
      return null;
    }

    membership.status = status;

    return this.repository.save(membership);
  }
}
