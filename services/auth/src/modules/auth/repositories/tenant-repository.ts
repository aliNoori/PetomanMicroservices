import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TenantEntity } from '../entities/tenant.entity';
import { TenantStatus } from '../entities/tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
  ) {}

  // ============================================================
  // FIND BY ID
  // ============================================================

  async findById(
    id: string,
  ): Promise<TenantEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  // ============================================================
  // FIND BY SLUG
  // ============================================================

  async findBySlug(
    slug: string,
  ): Promise<TenantEntity | null> {
    return this.repository.findOne({
      where: {
        slug,
      },
    });
  }

  // ============================================================
  // FIND BY OWNER
  // ============================================================

  async findByOwnerId(
    ownerId: string,
  ): Promise<TenantEntity[]> {
    return this.repository.find({
      where: {
        ownerId,
      },
    });
  }

  // ============================================================
  // FIND BY OWNER + STATUS
  // ============================================================

  async findByOwnerIdAndStatus(
    ownerId: string,
    status: TenantStatus,
  ): Promise<TenantEntity[]> {
    return this.repository.find({
      where: {
        ownerId,
        status,
      },
    });
  }

  // ============================================================
  // FIND BY STATUS
  // ============================================================

  async findByStatus(
    status: TenantStatus,
  ): Promise<TenantEntity[]> {
    return this.repository.find({
      where: {
        status,
      },
    });
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    data: Partial<TenantEntity>,
  ): Promise<TenantEntity> {
    const tenant = this.repository.create(data);

    return this.repository.save(tenant);
  }

  // ============================================================
  // SAVE
  // ============================================================

  async save(
    tenant: TenantEntity,
  ): Promise<TenantEntity> {
    return this.repository.save(tenant);
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async updateStatus(
    id: string,
    status: TenantStatus,
  ): Promise<TenantEntity | null> {
    const tenant = await this.findById(id);

    if (!tenant) {
      return null;
    }

    tenant.status = status;

    return this.repository.save(tenant);
  }
}
