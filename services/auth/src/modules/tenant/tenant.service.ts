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
import { UpdateTenantDto } from './dtos/update-tenant.dto';

import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';
import { TENANT_STATUS } from '../../common/constants/tenant.constants';
import { ROLE_SLUGS } from '../../common/constants/roles.constants';

import { InternalAuthScope, InternalJwtPayload } from '@petoman/security';

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
        type: dto.type,
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
        // Tenant
        'tenant.read',
        'tenant.update',

        // Tenant Membership
        'tenant.membership.read',
        'tenant.membership.approve',
        'tenant.membership.reject',

        // Tenant Roles
        'tenant.role.read',
        'tenant.role.assign',
        'tenant.role.remove',

        // Products
        'product.read',
        'product.create',
        'product.update',
        'product.delete',

        // Orders
        'order.read',
        'order.create',
      ];

      const staffPermissionSlugs = [
        // Tenant
        'tenant.read',

        // Tenant Membership
        'tenant.membership.read',

        // Products
        'product.read',
        'product.create',
        'product.update',

        // Orders
        'order.read',
        'order.create',
      ];

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
          message:
            `Required permissions were not found: ` +
            `${missingPermissions.join(', ')}`,
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
        tenant: {
          id: savedTenant.id,
          name: savedTenant.name,
          slug: savedTenant.slug,
          type: savedTenant.type,
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
   *
   * Non-global requests additionally require
   * an active membership in the requested tenant.
   */
  async getTenant(requester: InternalJwtPayload, tenantId: string) {
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

    await this.assertActiveTenantMembership(requester, tenant.id);

    return {
      success: true as const,

      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        ownerId: tenant.ownerId,
        status: tenant.status,
      },
    };
  }

  // ============================================================
  // Update Tenant
  // ============================================================

  /**
   * Update Tenant information.
   *
   * Non-global requests require:
   *
   * - TENANT scope
   * - matching tenantId
   * - active membership in the tenant
   */
  async updateTenant(
    requester: InternalJwtPayload,
    tenantId: string,
    dto: UpdateTenantDto,
  ) {
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

    await this.assertActiveTenantMembership(requester, tenant.id);

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
        type: savedTenant.type,
        ownerId: savedTenant.ownerId,
        status: savedTenant.status,
      },
    };
  }

  // ============================================================
  // Get Tenant Memberships
  // ============================================================

  async getTenantMemberships(requester: InternalJwtPayload, tenantId: string) {
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

    // GLOBAL scope can access memberships of any tenant.
    if (requester.scope !== InternalAuthScope.GLOBAL) {
      await this.assertActiveTenantMembership(requester, tenantId);
    }

    const memberships =
      await this.tenantUserRepository.findByTenantId(tenantId);

    return {
      success: true as const,

      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          type: tenant.type,
          status: tenant.status,
        },

        memberships: memberships.map((membership) => ({
          membershipId: membership.id,
          tenantId: membership.tenantId,
          userId: membership.userId,
          status: membership.status,
          createdAt: membership.createdAt,

          user: membership.user
            ? {
                id: membership.user.id,
                email: membership.user.email,
                firstName: membership.user.firstName,
                lastName: membership.user.lastName,
                avatarKey: membership.user.avatarKey,
                isActive: membership.user.isActive,
              }
            : null,

          roles: (membership.user?.userRoles ?? [])
            .filter(
              (userRole) => userRole.tenantId === tenantId && userRole.role,
            )
            .map((userRole) => ({
              roleId: userRole.role.id,
              name: userRole.role.name,
              slug: userRole.role.slug,
            })),
        })),
      },
    };
  }

  // ============================================================
  // Find Active Tenants
  // ============================================================

  async findActiveTenants(): Promise<
    Pick<TenantEntity, 'id' | 'name' | 'slug' | 'type'>[]
  > {
    return this.tenantRepository.find({
      where: {
        status: TENANT_STATUS.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
      order: {
        createdAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  // ============================================================
  // Find Tenant By Slug
  // ============================================================

  async findBySlug(storeSlug: string): Promise<TenantEntity | null> {
    const normalizedSlug = storeSlug.trim().toLowerCase();

    if (!normalizedSlug) {
      return null;
    }

    return this.tenantRepository.findOne({
      where: {
        slug: normalizedSlug,
      },
    });
  }

  // ============================================================
  // Tenant Scope Validation
  // ============================================================

  /**
   * Validate that the requester can operate on the target tenant.
   *
   * GLOBAL:
   *   Can access any tenant.
   *
   * TENANT:
   *   Must have a tenant context matching the target tenant.
   *
   * NO_TENANT:
   *   Cannot access tenant-scoped resources.
   */
  private assertTenantScope(
    requester: InternalJwtPayload,
    targetTenantId: string,
  ): void {
    if (requester.scope === InternalAuthScope.GLOBAL) {
      return;
    }

    if (requester.scope !== InternalAuthScope.TENANT || !requester.tenantId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.TENANT_CONTEXT_REQUIRED,
        message: 'A Tenant context is required for this operation.',
      });
    }

    if (requester.tenantId !== targetTenantId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.TENANT_SCOPE_FORBIDDEN,
        message: 'You are not authorized to operate on this Tenant.',
      });
    }
  }

  // ============================================================
  // Active Membership Validation
  // ============================================================

  /**
   * Validate tenant scope and active membership.
   *
   * GLOBAL requests are allowed without a membership check.
   * Non-global requests must:
   *
   * - have a valid TENANT scope
   * - target the same tenant as the JWT context
   * - have an active membership in that tenant
   */
  private async assertActiveTenantMembership(
    requester: InternalJwtPayload,
    tenantId: string,
  ): Promise<void> {
    this.assertTenantScope(requester, tenantId);

    // GLOBAL scope is already authorized.
    if (requester.scope === InternalAuthScope.GLOBAL) {
      return;
    }

    if (!requester.userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    const membership = await this.tenantUserRepository.findActiveMembership(
      tenantId,
      requester.userId,
    );

    if (!membership) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'You are not an active member of this tenant.',
      });
    }
  }
}
