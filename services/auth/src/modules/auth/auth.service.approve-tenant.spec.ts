import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuthService } from './auth.service';

import { InternalAuthScope, InternalJwtPayload } from '@petoman/security';

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

describe('AuthService.approveTenant', () => {
  let service: AuthService;
  let dataSource: { transaction: jest.Mock };

  let userRepository: ReturnType<typeof createRepositoryMock>;
  let tenantRepository: ReturnType<typeof createRepositoryMock>;
  let tenantUserRepository: ReturnType<typeof createRepositoryMock>;
  let userRoleRepository: ReturnType<typeof createRepositoryMock>;
  let roleRepository: ReturnType<typeof createRepositoryMock>;
  let permissionRepository: ReturnType<typeof createRepositoryMock>;
  let rolePermissionRepository: ReturnType<typeof createRepositoryMock>;

  let repositories: Map<unknown, ReturnType<typeof createRepositoryMock>>;
  let manager: { getRepository: jest.Mock };

  let queryBuilder: {
    insert: jest.Mock;
    into: jest.Mock;
    values: jest.Mock;
    orIgnore: jest.Mock;
    execute: jest.Mock;
  };

  function createRepositoryMock() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => ({ id: 'mock-id', ...value })),
      save: jest.fn(async (value) => value),
      createQueryBuilder: jest.fn(),
    };
  }

  const requester: InternalJwtPayload = {
    sub: 'gateway',
    type: 'internal',
    scope: InternalAuthScope.GLOBAL,
    userId: 'admin-1',
  };

  const adminUser = {
    id: 'admin-1',
    isActive: true,
  };

  const owner = {
    id: 'owner-1',
    isActive: true,
  };

  const pendingTenant = () => ({
    id: 'tenant-1',
    name: 'Petoman',
    slug: 'petoman',
    ownerId: 'owner-1',
    status: TENANT_STATUS.PENDING,
  });

  const superAdminRole = {
    id: 'super-admin-role',
    slug: ROLE_SLUGS.SUPER_ADMIN,
    isSystem: true,
    tenantId: null,
  };

  const tenantAdminRole = {
    id: 'tenant-admin-role',
    slug: ROLE_SLUGS.TENANT_ADMIN,
    isSystem: false,
    tenantId: 'tenant-1',
  };

  const staffRole = {
    id: 'staff-role',
    slug: ROLE_SLUGS.STAFF,
    isSystem: false,
    tenantId: 'tenant-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository = createRepositoryMock();
    tenantRepository = createRepositoryMock();
    tenantUserRepository = createRepositoryMock();
    userRoleRepository = createRepositoryMock();
    roleRepository = createRepositoryMock();
    permissionRepository = createRepositoryMock();
    rolePermissionRepository = createRepositoryMock();

    repositories = new Map<unknown, ReturnType<typeof createRepositoryMock>>();

    repositories.set(UserEntity, userRepository);
    repositories.set(TenantEntity, tenantRepository);
    repositories.set(TenantUserEntity, tenantUserRepository);
    repositories.set(UserRoleEntity, userRoleRepository);
    repositories.set(RoleEntity, roleRepository);
    repositories.set(PermissionEntity, permissionRepository);
    repositories.set(RolePermissionEntity, rolePermissionRepository);

    manager = {
      getRepository: jest.fn((entity) => repositories.get(entity)),
    };

    dataSource = {
      transaction: jest.fn((callback: (manager: unknown) => Promise<unknown>) =>
        callback(manager),
      ),
    };

    queryBuilder = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orIgnore: jest.fn(),
      execute: jest.fn().mockResolvedValue({}),
    };

    queryBuilder.insert.mockReturnValue(queryBuilder);
    queryBuilder.into.mockReturnValue(queryBuilder);
    queryBuilder.values.mockReturnValue(queryBuilder);
    queryBuilder.orIgnore.mockReturnValue(queryBuilder);

    rolePermissionRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    roleRepository.create.mockImplementation((value: any) => ({
      ...value,
      id:
        value.slug === ROLE_SLUGS.TENANT_ADMIN
          ? 'tenant-admin-role'
          : 'staff-role',
    }));

    service = new AuthService(
      { sign: jest.fn() } as any,
      dataSource as unknown as DataSource,
      userRepository as any,
      tenantRepository as any,
      tenantUserRepository as any,
      userRoleRepository as any,
      rolePermissionRepository as any,
    );
  });

  function configureValidAdministrator() {
    userRepository.findOne.mockResolvedValue(adminUser);

    roleRepository.findOne.mockImplementation(async (options: any) => {
      if (options.where.slug === ROLE_SLUGS.SUPER_ADMIN) {
        return superAdminRole;
      }

      if (options.where.slug === ROLE_SLUGS.TENANT_ADMIN) {
        return tenantAdminRole;
      }

      if (options.where.slug === ROLE_SLUGS.STAFF) {
        return staffRole;
      }

      return null;
    });

    userRoleRepository.findOne.mockImplementation(async (options: any) => {
      if (options.where.roleId === superAdminRole.id) {
        return {
          userId: adminUser.id,
          roleId: superAdminRole.id,
          tenantId: null,
        };
      }

      return null;
    });
  }

  function configureValidApproval() {
    configureValidAdministrator();

    userRepository.findOne
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(owner);

    tenantRepository.findOne.mockResolvedValue(pendingTenant());

    permissionRepository.find.mockResolvedValue([
      {
        id: 'permission-approve',
        slug: 'tenant.membership.approve',
      },
      {
        id: 'permission-reject',
        slug: 'tenant.membership.reject',
      },
    ]);

    tenantUserRepository.findOne.mockResolvedValue(null);
  }

  it('rejects a requester without GLOBAL scope', async () => {
    const tenantRequester = {
      ...requester,
      scope: InternalAuthScope.TENANT,
      tenantId: 'tenant-1',
    } as InternalJwtPayload;

    await expect(
      service.approveTenant(tenantRequester, 'tenant-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects a GLOBAL service token without a userId', async () => {
    const serviceToken = {
      sub: 'gateway',
      type: 'internal',
      scope: InternalAuthScope.GLOBAL,
    } as InternalJwtPayload;

    await expect(
      service.approveTenant(serviceToken, 'tenant-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects an inactive administrator', async () => {
    userRepository.findOne.mockResolvedValue({
      ...adminUser,
      isActive: false,
    });

    await expect(
      service.approveTenant(requester, 'tenant-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(roleRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects when the SUPER_ADMIN system role is missing', async () => {
    userRepository.findOne.mockResolvedValue(adminUser);
    roleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.approveTenant(requester, 'tenant-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(tenantRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects a user without an actual SUPER_ADMIN assignment', async () => {
    userRepository.findOne.mockResolvedValue(adminUser);
    roleRepository.findOne.mockResolvedValue(superAdminRole);
    userRoleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.approveTenant(requester, 'tenant-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tenantRepository.findOne).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the tenant does not exist', async () => {
    configureValidAdministrator();

    tenantRepository.findOne.mockResolvedValue(null);

    await expect(
      service.approveTenant(requester, 'missing-tenant'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a tenant that is already active', async () => {
    configureValidAdministrator();

    tenantRepository.findOne.mockResolvedValue({
      ...pendingTenant(),
      status: TENANT_STATUS.ACTIVE,
    });

    await expect(
      service.approveTenant(requester, 'tenant-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tenantRepository.save).not.toHaveBeenCalled();
  });

  it('rejects an inactive tenant owner', async () => {
    configureValidAdministrator();

    tenantRepository.findOne.mockResolvedValue(pendingTenant());

    userRepository.findOne
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce({
        ...owner,
        isActive: false,
      });

    await expect(
      service.approveTenant(requester, 'tenant-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tenantRepository.save).not.toHaveBeenCalled();
  });

  it('does not activate a tenant when a required permission is missing', async () => {
    configureValidAdministrator();

    tenantRepository.findOne.mockResolvedValue(pendingTenant());

    userRepository.findOne
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(owner);

    permissionRepository.find.mockResolvedValue([
      {
        id: 'permission-approve',
        slug: 'tenant.membership.approve',
      },
    ]);

    await expect(
      service.approveTenant(requester, 'tenant-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(tenantUserRepository.save).not.toHaveBeenCalled();
  });

  it('approves the tenant and provisions its owner', async () => {
    configureValidApproval();

    // The default roles are created when they do not already exist.
    roleRepository.findOne
      .mockResolvedValueOnce(superAdminRole)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.approveTenant(requester, 'tenant-1');

    expect(result.success).toBe(true);
    expect(result.data.tenant.status).toBe(TENANT_STATUS.ACTIVE);

    expect(result.data.ownerMembership).toMatchObject({
      tenantId: 'tenant-1',
      userId: 'owner-1',
      status: MEMBERSHIP_STATUS.ACTIVE,
    });

    expect(result.data.ownerRole).toEqual({
      roleId: 'tenant-admin-role',
      role: ROLE_SLUGS.TENANT_ADMIN,
    });

    expect(result.data.defaultRoles).toEqual([
      {
        id: 'staff-role',
        slug: ROLE_SLUGS.STAFF,
      },
      {
        id: 'tenant-admin-role',
        slug: ROLE_SLUGS.TENANT_ADMIN,
      },
    ]);

    expect(result.data.permissions).toEqual([
      'tenant.membership.approve',
      'tenant.membership.reject',
    ]);

    expect(tenantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tenant-1',
        status: TENANT_STATUS.ACTIVE,
      }),
    );

    expect(tenantUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'owner-1',
        status: MEMBERSHIP_STATUS.ACTIVE,
      }),
    );

    expect(userRoleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'owner-1',
        roleId: 'tenant-admin-role',
        tenantId: 'tenant-1',
      }),
    );

    expect(queryBuilder.values).toHaveBeenCalledWith([
      {
        roleId: 'tenant-admin-role',
        permissionId: 'permission-approve',
      },
      {
        roleId: 'tenant-admin-role',
        permissionId: 'permission-reject',
      },
    ]);

    expect(queryBuilder.execute).toHaveBeenCalled();
  });
});
