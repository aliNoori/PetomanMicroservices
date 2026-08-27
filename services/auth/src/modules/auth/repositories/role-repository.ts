import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {}

  // ============================================================
  // FIND BY ID
  // ============================================================

  async findById(
    id: string,
  ): Promise<RoleEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  // ============================================================
  // FIND SYSTEM ROLE BY SLUG
  // ============================================================

  /**
   * System roles:
   *
   *   isSystem = true
   *   tenantId = null
   *
   * Example:
   *
   *   SUPER_ADMIN
   */
  async findSystemRoleBySlug(
    slug: string,
  ): Promise<RoleEntity | null> {
    return this.repository.findOne({
      where: {
        slug,
        isSystem: true,
        tenantId: IsNull(),
      },
    });
  }

  // ============================================================
  // FIND TENANT ROLE BY SLUG
  // ============================================================

  /**
   * Tenant roles:
   *
   *   isSystem = false
   *   tenantId = specific tenant
   *
   * The tenantId MUST always be part of this query.
   */
  async findTenantRoleBySlug(
    tenantId: string,
    slug: string,
  ): Promise<RoleEntity | null> {
    return this.repository.findOne({
      where: {
        tenantId,
        slug,
        isSystem: false,
      },
    });
  }

  // ============================================================
  // FIND ROLES BY TENANT
  // ============================================================

  async findByTenantId(
    tenantId: string,
  ): Promise<RoleEntity[]> {
    return this.repository.find({
      where: {
        tenantId,
        isSystem: false,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  // ============================================================
  // FIND ALL SYSTEM ROLES
  // ============================================================

  async findAllSystemRoles(): Promise<RoleEntity[]> {
    return this.repository.find({
      where: {
        isSystem: true,
        tenantId: IsNull(),
      },
      order: {
        name: 'ASC',
      },
    });
  }

  // ============================================================
  // FIND ALL ROLES FOR TENANT
  // ============================================================

  /**
   * Returns only tenant-scoped roles.
   *
   * System roles are intentionally excluded.
   */
  async findTenantRoles(
    tenantId: string,
  ): Promise<RoleEntity[]> {
    return this.repository.find({
      where: {
        tenantId,
        isSystem: false,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  // ============================================================
  // CREATE SYSTEM ROLE
  // ============================================================

  async createSystemRole(
    data: Pick<
      RoleEntity,
      'name' | 'slug' | 'description'
    >,
  ): Promise<RoleEntity> {
    const role = this.repository.create({
      ...data,
      tenantId: null,
      isSystem: true,
    });

    return this.repository.save(role);
  }

  // ============================================================
  // CREATE TENANT ROLE
  // ============================================================

  async createTenantRole(
    tenantId: string,
    data: Pick<
      RoleEntity,
      'name' | 'slug' | 'description'
    >,
  ): Promise<RoleEntity> {
    const role = this.repository.create({
      ...data,
      tenantId,
      isSystem: false,
    });

    return this.repository.save(role);
  }

  // ============================================================
  // SAVE
  // ============================================================

  async save(
    role: RoleEntity,
  ): Promise<RoleEntity> {
    return this.repository.save(role);
  }
}
