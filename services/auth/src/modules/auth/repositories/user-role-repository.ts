import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRoleEntity } from '../entities/user-role.entity';

@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly repository: Repository<UserRoleEntity>,
  ) {}

  // ============================================================
  // FIND SYSTEM ROLE ASSIGNMENT
  // ============================================================

  /**
   * Finds a system-level role assignment.
   *
   * System assignment:
   *
   *   user_id = userId
   *   role_id = roleId
   *   tenant_id IS NULL
   */
  async findSystemAssignment(
    userId: string,
    roleId: string,
  ): Promise<UserRoleEntity | null> {
    return this.repository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.user', 'user')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('userRole.user_id = :userId', {
        userId,
      })
      .andWhere('userRole.role_id = :roleId', {
        roleId,
      })
      .andWhere('userRole.tenant_id IS NULL')
      .getOne();
  }

  // ============================================================
  // FIND TENANT ROLE ASSIGNMENT
  // ============================================================

  /**
   * Finds a tenant-scoped role assignment.
   *
   * Tenant assignment:
   *
   *   user_id = userId
   *   role_id = roleId
   *   tenant_id = tenantId
   */
  async findTenantAssignment(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<UserRoleEntity | null> {
    return this.repository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.user', 'user')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('userRole.tenant', 'tenant')
      .where('userRole.tenant_id = :tenantId', {
        tenantId,
      })
      .andWhere('userRole.user_id = :userId', {
        userId,
      })
      .andWhere('userRole.role_id = :roleId', {
        roleId,
      })
      .getOne();
  }

  // ============================================================
  // FIND ALL USER ASSIGNMENTS
  // ============================================================

  async findByUserId(
    userId: string,
  ): Promise<UserRoleEntity[]> {
    return this.repository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('userRole.tenant', 'tenant')
      .where('userRole.user_id = :userId', {
        userId,
      })
      .orderBy('userRole.created_at', 'ASC')
      .getMany();
  }

  // ============================================================
  // FIND USER SYSTEM ASSIGNMENTS
  // ============================================================

  async findSystemAssignmentsByUserId(
    userId: string,
  ): Promise<UserRoleEntity[]> {
    return this.repository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('userRole.user_id = :userId', {
        userId,
      })
      .andWhere('userRole.tenant_id IS NULL')
      .andWhere('role.is_system = TRUE')
      .orderBy('role.slug', 'ASC')
      .getMany();
  }

  // ============================================================
  // FIND USER TENANT ASSIGNMENTS
  // ============================================================

  async findTenantAssignmentsByUserId(
    tenantId: string,
    userId: string,
  ): Promise<UserRoleEntity[]> {
    return this.repository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('userRole.tenant_id = :tenantId', {
        tenantId,
      })
      .andWhere('userRole.user_id = :userId', {
        userId,
      })
      .andWhere('role.is_system = FALSE')
      .orderBy('role.slug', 'ASC')
      .getMany();
  }

  // ============================================================
  // FIND USERS WITH ROLE
  // ============================================================

  async findUsersByRoleId(
    roleId: string,
  ): Promise<UserRoleEntity[]> {
    return this.repository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.user', 'user')
      .leftJoinAndSelect('userRole.tenant', 'tenant')
      .where('userRole.role_id = :roleId', {
        roleId,
      })
      .orderBy('userRole.created_at', 'ASC')
      .getMany();
  }

  // ============================================================
  // CREATE SYSTEM ASSIGNMENT
  // ============================================================

  async createSystemAssignment(
    userId: string,
    roleId: string,
  ): Promise<UserRoleEntity> {
    const userRole = this.repository.create({
      user: {
        id: userId,
      },
      role: {
        id: roleId,
      },
      tenant: null,
    });

    return this.repository.save(userRole);
  }

  // ============================================================
  // CREATE TENANT ASSIGNMENT
  // ============================================================

  async createTenantAssignment(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<UserRoleEntity> {
    const userRole = this.repository.create({
      user: {
        id: userId,
      },
      role: {
        id: roleId,
      },
      tenant: {
        id: tenantId,
      },
    });

    return this.repository.save(userRole);
  }

  // ============================================================
  // REMOVE SYSTEM ASSIGNMENT
  // ============================================================

  async removeSystemAssignment(
    userId: string,
    roleId: string,
  ): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(UserRoleEntity)
      .where('user_id = :userId', {
        userId,
      })
      .andWhere('role_id = :roleId', {
        roleId,
      })
      .andWhere('tenant_id IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ============================================================
  // REMOVE TENANT ASSIGNMENT
  // ============================================================

  async removeTenantAssignment(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(UserRoleEntity)
      .where('tenant_id = :tenantId', {
        tenantId,
      })
      .andWhere('user_id = :userId', {
        userId,
      })
      .andWhere('role_id = :roleId', {
        roleId,
      })
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
