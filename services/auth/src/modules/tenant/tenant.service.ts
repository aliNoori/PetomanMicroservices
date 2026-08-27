import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { TenantEntity } from '../auth/entities/tenant.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { RoleEntity } from '../auth/entities/role.entity';
import { PermissionEntity } from '../auth/entities/permission.entity';
import { RolePermissionEntity } from '../auth/entities/role-permission.entity';

import { CreateTenantDto } from './dtos/create-tenant.dto';

import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';
import { TENANT_STATUS } from '../../common/constants/tenant.constants';
import { ROLE_SLUGS } from '../../common/constants/roles.constants';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { AuthenticatedRequest } from '@petoman/security';
import { TenantUserRepository } from '../auth/repositories/tenant-user-repository';

@Injectable()
export class TenantService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,

    private readonly tenantUserRepository: TenantUserRepository,
  ) {}

  // ============================================================
  // Create Tenant
  // ============================================================

  /**
   * Create a new Tenant.
   *
   * Flow:
   *
   * User
   *   ↓
   * Tenant PENDING
   *   ↓
   * TENANT_ADMIN Role
   *   ↓
   * STAFF Role
   *   ↓
   * Role Permissions
   *
   * Important:
   *
   * - Tenant starts as PENDING.
   * - Tenant is not active yet.
   * - Owner membership is NOT created here.
   * - Owner TENANT_ADMIN role is NOT assigned here.
   *
   * Owner membership + TENANT_ADMIN assignment
   * happen during Tenant approval.
   *
   * Everything is executed inside one transaction.
   */
  async createTenant(ownerId: string, dto: CreateTenantDto) {
    const normalizedName = dto.name.trim();
    const normalizedSlug = dto.slug.trim().toLowerCase();

    if (!normalizedName) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
        message: 'Tenant name is required.',
      });
    }

    if (!normalizedSlug) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.TENANT_SLUG_ALREADY_EXISTS,
        message: 'Tenant slug is required.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      // ========================================================
      // Repositories
      // ========================================================

      const userRepository = manager.getRepository(UserEntity);

      const tenantRepository = manager.getRepository(TenantEntity);

      const roleRepository = manager.getRepository(RoleEntity);

      const permissionRepository = manager.getRepository(PermissionEntity);

      const rolePermissionRepository =
        manager.getRepository(RolePermissionEntity);

      // ========================================================
      // 1. Verify Owner
      // ========================================================

      const owner = await userRepository.findOne({
        where: {
          id: ownerId,
        },
      });

      if (!owner) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found.',
        });
      }

      if (!owner.isActive) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.USER_INACTIVE,
          message: 'User account is inactive.',
        });
      }

      // ========================================================
      // 2. Check Tenant Slug
      // ========================================================

      const existingTenant = await tenantRepository.findOne({
        where: {
          slug: normalizedSlug,
        },
      });

      if (existingTenant) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_SLUG_ALREADY_EXISTS,
          message: 'A tenant with this slug already exists.',
        });
      }

      // ========================================================
      // 3. Create Tenant
      // ========================================================

      const tenant = tenantRepository.create({
        name: normalizedName,
        slug: normalizedSlug,
        ownerId: owner.id,
        status: TENANT_STATUS.PENDING,
      });

      const savedTenant = await tenantRepository.save(tenant);

      // ========================================================
      // 4. Create TENANT_ADMIN Role
      // ========================================================

      const tenantAdminRole = roleRepository.create({
        tenantId: savedTenant.id,
        name: 'Tenant Administrator',
        slug: ROLE_SLUGS.TENANT_ADMIN,
        description: 'Administrator of the Tenant.',
        isSystem: false,
      });

      const savedTenantAdminRole = await roleRepository.save(tenantAdminRole);

      // ========================================================
      // 5. Create STAFF Role
      // ========================================================

      const staffRole = roleRepository.create({
        tenantId: savedTenant.id,
        name: 'Staff',
        slug: ROLE_SLUGS.STAFF,
        description: 'Standard staff member of the Tenant.',
        isSystem: false,
      });

      const savedStaffRole = await roleRepository.save(staffRole);

      // ========================================================
      // 6. Required Permissions
      // ========================================================

      const tenantAdminPermissionSlugs = [
        'tenant.read',
        'tenant.update',

        'tenant.membership.read',
        'tenant.membership.approve',
        'tenant.membership.reject',

        'tenant.role.read',
        'tenant.role.assign',
        'tenant.role.remove',
      ];

      const staffPermissionSlugs = ['tenant.read', 'tenant.membership.read'];

      const allPermissionSlugs = Array.from(
        new Set([...tenantAdminPermissionSlugs, ...staffPermissionSlugs]),
      );

      // ========================================================
      // 7. Load Permissions
      // ========================================================

      const permissions = await permissionRepository.find({
        where: allPermissionSlugs.map((slug) => ({
          slug,
        })),
      });

      const permissionMap = new Map(
        permissions.map((permission) => [permission.slug, permission]),
      );

      // ========================================================
      // 8. Validate Permissions
      // ========================================================

      const missingPermissions = allPermissionSlugs.filter(
        (slug) => !permissionMap.has(slug),
      );

      if (missingPermissions.length > 0) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
          message: `Required permissions were not found: ${missingPermissions.join(
            ', ',
          )}`,
        });
      }

      // ========================================================
      // 9. Prepare Role Permissions
      // ========================================================

      const rolePermissionRows = [
        ...tenantAdminPermissionSlugs.map((slug) => ({
          roleId: savedTenantAdminRole.id,
          permissionId: permissionMap.get(slug)!.id,
        })),

        ...staffPermissionSlugs.map((slug) => ({
          roleId: savedStaffRole.id,
          permissionId: permissionMap.get(slug)!.id,
        })),
      ];

      // ========================================================
      // 10. Insert Role Permissions
      // ========================================================

      if (rolePermissionRows.length > 0) {
        await rolePermissionRepository
          .createQueryBuilder()
          .insert()
          .into(RolePermissionEntity)
          .values(rolePermissionRows)
          .orIgnore()
          .execute();
      }

      // ========================================================
      // 11. Return
      // ========================================================

      return {
        success: true as const,

        data: {
          tenant: {
            id: savedTenant.id,
            name: savedTenant.name,
            slug: savedTenant.slug,
            ownerId: savedTenant.ownerId,
            status: savedTenant.status,
          },

          defaultRoles: {
            tenantAdmin: {
              id: savedTenantAdminRole.id,
              slug: savedTenantAdminRole.slug,
            },

            staff: {
              id: savedStaffRole.id,
              slug: savedStaffRole.slug,
            },
          },

          permissions: {
            tenantAdmin: tenantAdminPermissionSlugs,

            staff: staffPermissionSlugs,
          },
        },
      };
    });
  }

  // ============================================================
  // Get Tenant
  // ============================================================

  /**
   * Get Tenant information.
   *
   * Access is controlled by:
   *
   * JwtAuthGuard
   * PermissionsGuard
   * tenant.read
   */
  async getTenant(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
        message: 'Tenant not found.',
      });
    }

    return {
      success: true as const,

      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        ownerId: tenant.ownerId,
        status: tenant.status,
      },
    };
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
        message: 'Tenant not found.',
      });
    }

    if (dto.name !== undefined) {
      tenant.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      tenant.slug = dto.slug.trim().toLowerCase();
    }

    const savedTenant = await this.tenantRepository.save(tenant);

    return {
      success: true as const,
      data: {
        id: savedTenant.id,
        name: savedTenant.name,
        slug: savedTenant.slug,
        ownerId: savedTenant.ownerId,
        status: savedTenant.status,
      },
    };
  }

  async getTenantMemberships(
    requester: AuthenticatedRequest['user'],
    tenantId: string,
  ) {
    // ============================================================
    // 1. Validate authenticated context
    // ============================================================

    if (!requester) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user context is missing.',
      });
    }

    // ============================================================
    // 2. Tenant must exist
    // ============================================================

    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
        message: 'Tenant not found.',
      });
    }

    // ============================================================
    // 3. SUPER_ADMIN
    // ============================================================

    const isSuperAdmin = requester.roles.includes(ROLE_SLUGS.SUPER_ADMIN);

    if (isSuperAdmin) {
      const memberships =
        await this.tenantUserRepository.findByTenantId(tenantId);

      return {
        success: true as const,

        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
          },

          memberships: memberships.map((membership) => ({
            membershipId: membership.id,
            tenantId: membership.tenantId,
            userId: membership.userId,
            status: membership.status,
          })),
        },
      };
    }

    // ============================================================
    // 4. Tenant context is required
    // ============================================================

    if (!requester.tenantId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'Tenant context is required for this action.',
      });
    }

    // ============================================================
    // 5. Tenant isolation
    // ============================================================

    if (requester.tenantId !== tenantId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'You do not have access to this tenant.',
      });
    }

    // ============================================================
    // 6. Verify active membership
    // ============================================================

    const membership = await this.tenantUserRepository.findActiveMembership(
      tenantId,
      requester.sub,
    );

    if (!membership) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'You are not an active member of this tenant.',
      });
    }

    // ============================================================
    // 7. Tenant-scoped query
    // ============================================================

    const memberships =
      await this.tenantUserRepository.findByTenantId(tenantId);

    // ============================================================
    // 8. Response
    // ============================================================

    return {
      success: true as const,

      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
        },

        memberships: memberships.map((membership) => ({
          membershipId: membership.id,
          tenantId: membership.tenantId,
          userId: membership.userId,
          status: membership.status,
        })),
      },
    };
  }
}
