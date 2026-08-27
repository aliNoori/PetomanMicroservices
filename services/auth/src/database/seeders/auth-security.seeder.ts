import 'reflect-metadata';
import 'dotenv/config';

import { DataSource } from 'typeorm';

import dataSource from '../data-source';

import { RoleEntity } from '../../modules/auth/entities/role.entity';
import { PermissionEntity } from '../../modules/auth/entities/permission.entity';
import { RolePermissionEntity } from '../../modules/auth/entities/role-permission.entity';

import { ROLE_SLUGS } from '../../common/constants/roles.constants';

const PERMISSIONS = [
  // ============================================================
  // User
  // ============================================================

  {
    slug: 'user.read',
    name: 'Read User',
    description:
      'Allows reading user identity and authorization information.',
  },

  // ============================================================
  // Tenant
  // ============================================================

  {
    slug: 'tenant.read',
    name: 'Read Tenant',
    description:
      'Allows reading tenant information.',
  },

  {
    slug: 'tenant.update',
    name: 'Update Tenant',
    description:
      'Allows updating tenant information.',
  },

  {
    slug: 'tenant.approve',
    name: 'Approve Tenant',
    description:
      'Allows approving a pending tenant.',
  },

  // ============================================================
  // Tenant Membership
  // ============================================================

  {
    slug: 'tenant.membership.request',
    name: 'Request Tenant Membership',
    description:
      'Allows requesting membership in a tenant.',
  },

  {
    slug: 'tenant.membership.read',
    name: 'Read Tenant Membership',
    description:
      'Allows reading tenant membership information.',
  },

  {
    slug: 'tenant.membership.approve',
    name: 'Approve Tenant Membership',
    description:
      'Allows approving a pending tenant membership.',
  },

  {
    slug: 'tenant.membership.reject',
    name: 'Reject Tenant Membership',
    description:
      'Allows rejecting a pending tenant membership.',
  },

  // ============================================================
  // Tenant Roles
  // ============================================================

  {
    slug: 'tenant.role.read',
    name: 'Read Tenant Roles',
    description:
      'Allows reading tenant roles.',
  },

  {
    slug: 'tenant.role.assign',
    name: 'Assign Tenant Role',
    description:
      'Allows assigning a role to a tenant member.',
  },

  {
    slug: 'tenant.role.remove',
    name: 'Remove Tenant Role',
    description:
      'Allows removing a role from a tenant member.',
  },
] as const;

const SUPER_ADMIN = {
  slug: ROLE_SLUGS.SUPER_ADMIN,
  name: 'Super Admin',
  description:
    'System-wide administrator with access across all tenants.',
};

async function seed(): Promise<void> {
  const dataSourceInstance: DataSource =
    await dataSource.initialize();

  try {
    const permissionRepository =
      dataSourceInstance.getRepository(
        PermissionEntity,
      );

    const roleRepository =
      dataSourceInstance.getRepository(
        RoleEntity,
      );

    const rolePermissionRepository =
      dataSourceInstance.getRepository(
        RolePermissionEntity,
      );

    console.log(
      'Starting auth security seed...',
    );

    // ============================================================
    // 1. Seed Permissions
    // ============================================================

    const permissions: PermissionEntity[] = [];

    for (const permissionData of PERMISSIONS) {
      let permission =
        await permissionRepository.findOne({
          where: {
            slug: permissionData.slug,
          },
        });

      if (!permission) {
        permission =
          permissionRepository.create({
            slug: permissionData.slug,
            name: permissionData.name,
            description:
              permissionData.description,
          });

        permission =
          await permissionRepository.save(
            permission,
          );

        console.log(
          `Created permission: ${permission.slug}`,
        );
      } else {
        console.log(
          `Permission already exists: ${permission.slug}`,
        );
      }

      permissions.push(permission);
    }

    // ============================================================
    // 2. Seed SUPER_ADMIN System Role
    // ============================================================

    let superAdminRole =
      await roleRepository.findOne({
        where: {
          slug: SUPER_ADMIN.slug,
          isSystem: true,
        },
      });

    if (!superAdminRole) {
      superAdminRole =
        roleRepository.create({
          tenantId: null,
          name: SUPER_ADMIN.name,
          slug: SUPER_ADMIN.slug,
          description:
            SUPER_ADMIN.description,
          isSystem: true,
        });

      superAdminRole =
        await roleRepository.save(
          superAdminRole,
        );

      console.log(
        `Created role: ${superAdminRole.slug}`,
      );
    } else {
      console.log(
        `Role already exists: ${superAdminRole.slug}`,
      );
    }

    // ============================================================
    // 3. Assign ALL Permissions to SUPER_ADMIN
    // ============================================================

    for (const permission of permissions) {
      const existing =
        await rolePermissionRepository.findOne({
          where: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });

      if (!existing) {
        await rolePermissionRepository.save(
          rolePermissionRepository.create({
            roleId: superAdminRole.id,
            permissionId: permission.id,
          }),
        );

        console.log(
          `Assigned ${permission.slug} -> ${superAdminRole.slug}`,
        );
      } else {
        console.log(
          `Assignment already exists: ${permission.slug} -> ${superAdminRole.slug}`,
        );
      }
    }

    // ============================================================
    // 4. Summary
    // ============================================================

    console.log('');
    console.log(
      `Permissions seeded: ${permissions.length}`,
    );

    console.log(
      `System role: ${superAdminRole.slug}`,
    );

    console.log(
      'SUPER_ADMIN permissions: ALL',
    );

    console.log('');
    console.log(
      'Auth security seed completed successfully.',
    );
  } finally {
    await dataSourceInstance.destroy();
  }
}

seed().catch((error) => {
  console.error(
    'Auth security seed failed:',
    error,
  );

  process.exit(1);
});