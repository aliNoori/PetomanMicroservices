import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import {
  InternalAuthScope,
  InternalJwtPayload,
  JwtPayload,
  JwtTokenService,
} from '@petoman/security';

import { MEMBERSHIP_STATUS } from '../../common/constants/membership.constants';
import { TENANT_STATUS } from '../../common/constants/tenant.constants';
import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';
import { ROLE_SLUGS } from '../../common/constants/roles.constants';

import { UserEntity } from './entities/user.entity';
import { TenantEntity } from './entities/tenant.entity';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RoleEntity } from './entities/role.entity';

import { RegisterUserDto } from './dtos/register-user-dto';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly dataSource: DataSource,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,

    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,

    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,

    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
  ) {}

  // ============================================================
  // Register
  // ============================================================

  async register(dto: RegisterUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'A user with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName: dto.firstName?.trim() || null,
      lastName: dto.lastName?.trim() || null,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      success: true as const,
      data: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        isActive: savedUser.isActive,
        tenantMemberships: [],
      },
    };
  }

  // ============================================================
  // Login
  // ============================================================

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password.',
      });
    }

    const memberships = await this.tenantUserRepository.find({
      where: {
        userId: user.id,
        status: MEMBERSHIP_STATUS.ACTIVE,
      },
      relations: {
        tenant: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const activeMemberships = memberships.filter(
      (membership) => membership.tenant.status === TENANT_STATUS.ACTIVE,
    );

    const systemUserRoles = await this.userRoleRepository.find({
      where: {
        userId: user.id,
        tenantId: IsNull(),
      },
      relations: {
        role: true,
      },
    });

    const systemRoles = systemUserRoles
      .filter((userRole) => userRole.role.isSystem === true)
      .map((userRole) => userRole.role.slug);

    const systemRoleIds = systemUserRoles
      .filter((userRole) => userRole.role.isSystem === true)
      .map((userRole) => userRole.roleId);

    const systemPermissions = await this.resolvePermissions(systemRoleIds);

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: null,
      email: user.email,
      roles: systemRoles,
      permissions: systemPermissions,
    };

    const accessToken = this.jwtTokenService.sign(payload);

    return {
      success: true as const,
      data: {
        accessToken,

        tenants: activeMemberships.map((membership) => ({
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
        })),
      },
    };
  }

  // ============================================================
  // Select Tenant
  // ============================================================

  async selectTenant(userId: string, tenantId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive.',
      });
    }

    const membership = await this.tenantUserRepository.findOne({
      where: {
        userId,
        tenantId,
        status: MEMBERSHIP_STATUS.ACTIVE,
      },
      relations: {
        tenant: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_REQUIRED,
        message: 'User is not an active member of the requested tenant.',
      });
    }

    if (membership.tenant.status !== TENANT_STATUS.ACTIVE) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.TENANT_INACTIVE,
        message: 'Tenant is inactive.',
      });
    }

    const userRoles = await this.userRoleRepository.find({
      where: {
        userId,
      },
      relations: {
        role: true,
      },
    });

    const contextUserRoles = userRoles.filter((userRole) => {
      // System roles are globally available.
      if (userRole.tenantId === null) {
        return userRole.role.isSystem === true;
      }

      // Tenant roles must belong to the selected tenant.
      return userRole.tenantId === tenantId && userRole.role.isSystem === false;
    });

    const roles = contextUserRoles.map((userRole) => userRole.role.slug);

    const roleIds = contextUserRoles.map((userRole) => userRole.roleId);

    const permissions = await this.resolvePermissions(roleIds);

    const payload: JwtPayload = {
      sub: user.id,
      tenantId,
      email: user.email,
      roles,
      permissions,
    };

    const accessToken = this.jwtTokenService.sign(payload);

    return {
      success: true as const,
      data: {
        accessToken,

        tenant: {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
        },

        roles,
        permissions,
      },
    };
  }

  // ============================================================
  // Profile
  // ============================================================

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive.',
      });
    }

    const memberships = await this.tenantUserRepository.find({
      where: {
        userId: user.id,
      },
      relations: {
        tenant: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const userRoles = await this.userRoleRepository.find({
      where: {
        userId: user.id,
      },
      relations: {
        role: true,
      },
    });

    const systemRoles = userRoles
      .filter(
        (userRole) =>
          userRole.tenantId === null && userRole.role.isSystem === true,
      )
      .map((userRole) => userRole.role.slug);

    const tenantRoles = userRoles
      .filter(
        (userRole) =>
          userRole.tenantId !== null && userRole.role.isSystem === false,
      )
      .map((userRole) => ({
        tenantId: userRole.tenantId,
        role: userRole.role.slug,
      }));

    return {
      success: true as const,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,

        systemRoles,

        tenantMemberships: memberships.map((membership) => ({
          membershipId: membership.id,
          tenantId: membership.tenantId,
          status: membership.status,

          tenant: {
            id: membership.tenant.id,
            name: membership.tenant.name,
            slug: membership.tenant.slug,
            status: membership.tenant.status,
            ownerId: membership.tenant.ownerId,
          },
        })),

        tenantRoles,
      },
    };
  }

  // ============================================================
  // Get User
  // ============================================================

  async getUser(requester: InternalJwtPayload, targetUserId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: targetUserId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive.',
      });
    }

    let memberships;

    if (requester.scope === InternalAuthScope.GLOBAL) {
      memberships = await this.tenantUserRepository.find({
        where: {
          userId: targetUserId,
        },
        relations: {
          tenant: true,
        },
        order: {
          createdAt: 'ASC',
        },
      });
    } else {
      if (!requester.tenantId) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.TENANT_CONTEXT_REQUIRED,
          message: 'A Tenant context is required.',
        });
      }

      memberships = await this.tenantUserRepository.find({
        where: {
          userId: targetUserId,
          tenantId: requester.tenantId,
        },
        relations: {
          tenant: true,
        },
        order: {
          createdAt: 'ASC',
        },
      });

      if (memberships.length === 0) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found.',
        });
      }
    }

    const userRoles = await this.userRoleRepository.find({
      where: {
        userId: targetUserId,
      },
      relations: {
        role: true,
      },
    });

    const systemRoles =
      requester.scope === InternalAuthScope.GLOBAL
        ? userRoles
            .filter(
              (userRole) =>
                userRole.tenantId === null && userRole.role.isSystem === true,
            )
            .map((userRole) => userRole.role.slug)
        : [];

    const tenantRoles = userRoles
      .filter((userRole) => {
        if (userRole.tenantId === null || userRole.role.isSystem === true) {
          return false;
        }

        if (requester.scope === InternalAuthScope.GLOBAL) {
          return true;
        }

        return userRole.tenantId === requester.tenantId;
      })
      .map((userRole) => ({
        tenantId: userRole.tenantId,
        role: userRole.role.slug,
      }));

    return {
      success: true as const,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,

        systemRoles,

        tenantMemberships: memberships.map((membership) => ({
          membershipId: membership.id,
          tenantId: membership.tenantId,
          status: membership.status,

          tenant: {
            id: membership.tenant.id,
            name: membership.tenant.name,
            slug: membership.tenant.slug,
            status: membership.tenant.status,
            ownerId: membership.tenant.ownerId,
          },
        })),

        tenantRoles,
      },
    };
  }

  // ============================================================
  // Create Tenant
  // ============================================================

  async createTenant(ownerId: string, name: string, slug: string) {
    const owner = await this.userRepository.findOne({
      where: {
        id: ownerId,
      },
    });

    if (!owner) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    if (!owner.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
      });
    }

    const normalizedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();

    const existingTenant = await this.tenantRepository.findOne({
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

    const tenant = this.tenantRepository.create({
      name: normalizedName,
      slug: normalizedSlug,
      ownerId: owner.id,
      status: TENANT_STATUS.PENDING,
    });

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

  // ============================================================
  // Approve Tenant
  // ============================================================

  async approveTenant(requester: InternalJwtPayload, tenantId: string) {
    if (requester.scope !== InternalAuthScope.GLOBAL) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'Only global administrators can approve tenants.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const tenantRepository = manager.getRepository(TenantEntity);

      const userRepository = manager.getRepository(UserEntity);

      const tenantUserRepository = manager.getRepository(TenantUserEntity);

      const roleRepository = manager.getRepository(RoleEntity);

      const userRoleRepository = manager.getRepository(UserRoleEntity);

      const permissionRepository = manager.getRepository(PermissionEntity);

      const rolePermissionRepository =
        manager.getRepository(RolePermissionEntity);

      // --------------------------------------------------------
      // Lock tenant
      // --------------------------------------------------------

      const tenant = await tenantRepository.findOne({
        where: {
          id: tenantId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!tenant) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
          message: 'Tenant not found.',
        });
      }

      if (tenant.status === TENANT_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Tenant is already active.',
        });
      }

      if (tenant.status !== TENANT_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Only pending tenants can be approved.',
        });
      }

      // --------------------------------------------------------
      // Verify owner
      // --------------------------------------------------------

      const owner = await userRepository.findOne({
        where: {
          id: tenant.ownerId,
        },
      });

      if (!owner) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'Tenant owner was not found.',
        });
      }

      if (!owner.isActive) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.USER_INACTIVE,
          message: 'Tenant owner is inactive.',
        });
      }

      // --------------------------------------------------------
      // Activate tenant
      // --------------------------------------------------------

      tenant.status = TENANT_STATUS.ACTIVE;

      await tenantRepository.save(tenant);

      // --------------------------------------------------------
      // Owner membership
      // --------------------------------------------------------

      let ownerMembership = await tenantUserRepository.findOne({
        where: {
          tenantId: tenant.id,
          userId: tenant.ownerId,
        },
      });

      if (!ownerMembership) {
        ownerMembership = tenantUserRepository.create({
          tenantId: tenant.id,
          userId: tenant.ownerId,
          status: MEMBERSHIP_STATUS.ACTIVE,
        });
      } else {
        ownerMembership.status = MEMBERSHIP_STATUS.ACTIVE;
      }

      ownerMembership = await tenantUserRepository.save(ownerMembership);

      // --------------------------------------------------------
      // Tenant Admin Role
      // --------------------------------------------------------

      let tenantAdminRole = await roleRepository.findOne({
        where: {
          tenantId: tenant.id,
          slug: ROLE_SLUGS.TENANT_ADMIN,
          isSystem: false,
        },
      });

      if (!tenantAdminRole) {
        tenantAdminRole = roleRepository.create({
          tenantId: tenant.id,
          name: 'Tenant Administrator',
          slug: ROLE_SLUGS.TENANT_ADMIN,
          description: 'Administrator of the tenant.',
          isSystem: false,
        });

        tenantAdminRole = await roleRepository.save(tenantAdminRole);
      }

      // --------------------------------------------------------
      // Staff Role
      // --------------------------------------------------------

      let staffRole = await roleRepository.findOne({
        where: {
          tenantId: tenant.id,
          slug: ROLE_SLUGS.STAFF,
          isSystem: false,
        },
      });

      if (!staffRole) {
        staffRole = roleRepository.create({
          tenantId: tenant.id,
          name: 'Staff',
          slug: ROLE_SLUGS.STAFF,
          description: 'Standard tenant member.',
          isSystem: false,
        });

        staffRole = await roleRepository.save(staffRole);
      }

      // --------------------------------------------------------
      // Assign Tenant Admin to Owner
      // --------------------------------------------------------

      const existingOwnerRole = await userRoleRepository.findOne({
        where: {
          userId: tenant.ownerId,
          roleId: tenantAdminRole.id,
          tenantId: tenant.id,
        },
      });

      if (!existingOwnerRole) {
        await userRoleRepository.save(
          userRoleRepository.create({
            userId: tenant.ownerId,
            roleId: tenantAdminRole.id,
            tenantId: tenant.id,
          }),
        );
      }

      // --------------------------------------------------------
      // Tenant Admin Permissions
      // --------------------------------------------------------

      const permissionSlugs = [
        'tenant.membership.approve',
        'tenant.membership.reject',
      ];

      const permissions = await permissionRepository.find({
        where: permissionSlugs.map((slug) => ({
          slug,
        })),
      });

      const permissionMap = new Map(
        permissions.map((permission) => [permission.slug, permission]),
      );

      const rolePermissionRows = permissionSlugs.map((slug) => {
        const permission = permissionMap.get(slug);

        if (!permission) {
          throw new NotFoundException({
            code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
            message: `Permission "${slug}" was not found.`,
          });
        }

        return {
          roleId: tenantAdminRole.id,
          permissionId: permission.id,
        };
      });

      if (rolePermissionRows.length > 0) {
        await rolePermissionRepository
          .createQueryBuilder()
          .insert()
          .into(RolePermissionEntity)
          .values(rolePermissionRows)
          .orIgnore()
          .execute();
      }

      return {
        success: true as const,

        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            ownerId: tenant.ownerId,
            status: tenant.status,
          },

          ownerMembership: {
            membershipId: ownerMembership.id,
            tenantId: ownerMembership.tenantId,
            userId: ownerMembership.userId,
            status: ownerMembership.status,
          },

          ownerRole: {
            roleId: tenantAdminRole.id,
            role: tenantAdminRole.slug,
          },

          defaultRoles: [
            {
              id: staffRole.id,
              slug: staffRole.slug,
            },
            {
              id: tenantAdminRole.id,
              slug: tenantAdminRole.slug,
            },
          ],

          permissions: permissionSlugs,
        },
      };
    });
  }

  // ============================================================
  // Request Tenant Membership
  // ============================================================

  async requestTenantMembership(userId: string, tenantId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
      });
    }

    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
      });
    }

    if (tenant.status !== TENANT_STATUS.ACTIVE) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.TENANT_INACTIVE,
        message: 'Tenant is not available for membership.',
      });
    }

    if (tenant.ownerId === userId) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_ALREADY_ACTIVE,
        message: 'Tenant owner already has an active membership.',
      });
    }

    const existingMembership = await this.tenantUserRepository.findOne({
      where: {
        tenantId,
        userId,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === MEMBERSHIP_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_ALREADY_ACTIVE,
        });
      }

      if (existingMembership.status === MEMBERSHIP_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_ALREADY_PENDING,
        });
      }

      if (existingMembership.status === MEMBERSHIP_STATUS.REJECTED) {
        existingMembership.status = MEMBERSHIP_STATUS.PENDING;

        const updated =
          await this.tenantUserRepository.save(existingMembership);

        return {
          success: true as const,
          data: {
            membershipId: updated.id,
            tenantId: updated.tenantId,
            userId: updated.userId,
            status: updated.status,
          },
        };
      }
    }

    const membership = this.tenantUserRepository.create({
      tenantId,
      userId,
      status: MEMBERSHIP_STATUS.PENDING,
    });

    const savedMembership = await this.tenantUserRepository.save(membership);

    return {
      success: true as const,
      data: {
        membershipId: savedMembership.id,
        tenantId: savedMembership.tenantId,
        userId: savedMembership.userId,
        status: savedMembership.status,
      },
    };
  }

  // ============================================================
  // Tenant Scope
  // ============================================================

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
  // Approve Membership
  // ============================================================

  async approveTenantMembership(
    requester: InternalJwtPayload,
    membershipId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepository = manager.getRepository(TenantUserEntity);

      const roleRepository = manager.getRepository(RoleEntity);

      const userRoleRepository = manager.getRepository(UserRoleEntity);

      const lockedMembership = await membershipRepository.findOne({
        where: {
          id: membershipId,
        },
        relations: {
          tenant: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!lockedMembership) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_NOT_FOUND,
        });
      }

      this.assertTenantScope(requester, lockedMembership.tenantId);

      if (lockedMembership.status !== MEMBERSHIP_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Only pending membership requests can be approved.',
        });
      }

      if (lockedMembership.tenant.status !== TENANT_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_INACTIVE,
        });
      }

      const staffRole = await roleRepository.findOne({
        where: {
          tenantId: lockedMembership.tenantId,
          slug: ROLE_SLUGS.STAFF,
          isSystem: false,
        },
      });

      if (!staffRole) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
          message: 'Default STAFF role for this Tenant was not found.',
        });
      }

      lockedMembership.status = MEMBERSHIP_STATUS.ACTIVE;

      const savedMembership = await membershipRepository.save(lockedMembership);

      const existingUserRole = await userRoleRepository.findOne({
        where: {
          userId: lockedMembership.userId,
          roleId: staffRole.id,
          tenantId: lockedMembership.tenantId,
        },
      });

      if (!existingUserRole) {
        await userRoleRepository.save(
          userRoleRepository.create({
            userId: lockedMembership.userId,
            roleId: staffRole.id,
            tenantId: lockedMembership.tenantId,
          }),
        );
      }

      return {
        success: true as const,
        data: {
          membershipId: savedMembership.id,
          tenantId: savedMembership.tenantId,
          userId: savedMembership.userId,
          status: savedMembership.status,

          role: {
            id: staffRole.id,
            slug: staffRole.slug,
          },
        },
      };
    });
  }

  // ============================================================
  // Reject Membership
  // ============================================================

  async rejectTenantMembership(
    requester: InternalJwtPayload,
    membershipId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepository = manager.getRepository(TenantUserEntity);

      const membership = await membershipRepository.findOne({
        where: {
          id: membershipId,
        },
        relations: {
          tenant: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!membership) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_NOT_FOUND,
        });
      }

      this.assertTenantScope(requester, membership.tenantId);

      if (membership.status !== MEMBERSHIP_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Only pending membership requests can be rejected.',
        });
      }

      if (membership.tenant.status !== TENANT_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_INACTIVE,
        });
      }

      membership.status = MEMBERSHIP_STATUS.REJECTED;

      const savedMembership = await membershipRepository.save(membership);

      return {
        success: true as const,
        data: {
          membershipId: savedMembership.id,
          tenantId: savedMembership.tenantId,
          userId: savedMembership.userId,
          status: savedMembership.status,
        },
      };
    });
  }

  // ============================================================
  // Resolve Permissions
  // ============================================================

  private async resolvePermissions(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: {
        roleId: In(roleIds),
      },
      relations: {
        permission: true,
      },
    });

    return Array.from(
      new Set(
        rolePermissions
          .map((rolePermission) => rolePermission.permission.slug)
          .filter(Boolean),
      ),
    ).sort();
  }
}
