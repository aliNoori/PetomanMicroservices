import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RolePermissionEntity } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionRepository {
  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly repository: Repository<RolePermissionEntity>,
  ) {}

  // ============================================================
  // FIND RELATION
  // ============================================================

  async findByRoleAndPermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissionEntity | null> {
    return this.repository.findOne({
      where: {
        role: {
          id: roleId,
        },
        permission: {
          id: permissionId,
        },
      },
    });
  }

  // ============================================================
  // FIND BY ROLE ID
  // ============================================================

  async findByRoleId(
    roleId: string,
  ): Promise<RolePermissionEntity[]> {
    return this.repository.find({
      where: {
        role: {
          id: roleId,
        },
      },
      relations: {
        permission: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  // ============================================================
  // FIND PERMISSIONS FOR ROLE
  // ============================================================

  async findPermissionsByRoleId(
    roleId: string,
  ): Promise<RolePermissionEntity[]> {
    return this.repository.find({
      where: {
        role: {
          id: roleId,
        },
      },
      relations: {
        permission: true,
      },
      order: {
        permission: {
          slug: 'ASC',
        },
      },
    });
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissionEntity> {
    const rolePermission = this.repository.create({
      role: {
        id: roleId,
      },
      permission: {
        id: permissionId,
      },
    });

    return this.repository.save(rolePermission);
  }

  // ============================================================
  // SAVE
  // ============================================================

  async save(
    rolePermission: RolePermissionEntity,
  ): Promise<RolePermissionEntity> {
    return this.repository.save(rolePermission);
  }

  // ============================================================
  // REMOVE
  // ============================================================

  async remove(
    rolePermission: RolePermissionEntity,
  ): Promise<RolePermissionEntity> {
    return this.repository.remove(rolePermission);
  }

  // ============================================================
  // REMOVE BY ROLE + PERMISSION
  // ============================================================

  async removeByRoleAndPermission(
    roleId: string,
    permissionId: string,
  ): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(RolePermissionEntity)
      .where(
        'role_id = :roleId',
        { roleId },
      )
      .andWhere(
        'permission_id = :permissionId',
        { permissionId },
      )
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
