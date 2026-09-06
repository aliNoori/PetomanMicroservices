import { AuthService } from './auth.service';

import { InternalAuthScope, type InternalJwtPayload } from '@petoman/security';

import { MEMBERSHIP_STATUS } from '../../common/constants/membership.constants';
import { TENANT_STATUS } from '../../common/constants/tenant.constants';
import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';

describe('AuthService - getUser', () => {
  let service: AuthService;

  const jwtTokenService = {
    sign: jest.fn(),
  };

  const dataSource = {};

  const userRepository = {
    findOne: jest.fn(),
  };

  const tenantRepository = {};

  const tenantUserRepository = {
    find: jest.fn(),
  };

  const userRoleRepository = {
    find: jest.fn(),
  };

  const rolePermissionRepository = {};

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService(
      jwtTokenService as any,
      dataSource as any,
      userRepository as any,
      tenantRepository as any,
      tenantUserRepository as any,
      userRoleRepository as any,
      rolePermissionRepository as any,
    );
  });

  it('should return all tenant memberships for GLOBAL scope', async () => {
    const targetUserId = 'target-user';

    userRepository.findOne.mockResolvedValue({
      id: targetUserId,
      email: 'target@test.com',
      firstName: 'Target',
      lastName: 'User',
      isActive: true,
    });

    tenantUserRepository.find.mockResolvedValue([
      {
        id: 'membership-a',
        userId: targetUserId,
        tenantId: 'tenant-a',
        status: MEMBERSHIP_STATUS.ACTIVE,
        createdAt: new Date('2026-01-01'),
        tenant: {
          id: 'tenant-a',
          name: 'Tenant A',
          slug: 'tenant-a',
          status: TENANT_STATUS.ACTIVE,
          ownerId: 'owner-a',
        },
      },
      {
        id: 'membership-b',
        userId: targetUserId,
        tenantId: 'tenant-b',
        status: MEMBERSHIP_STATUS.ACTIVE,
        createdAt: new Date('2026-01-02'),
        tenant: {
          id: 'tenant-b',
          name: 'Tenant B',
          slug: 'tenant-b',
          status: TENANT_STATUS.ACTIVE,
          ownerId: 'owner-b',
        },
      },
    ]);

    userRoleRepository.find.mockResolvedValue([]);

    const requester: InternalJwtPayload = {
      sub: 'gateway',
      type: 'internal',
      scope: InternalAuthScope.GLOBAL,
      userId: 'super-admin',
    };

    const result = await service.getUser(requester, targetUserId);

    expect(result.data.tenantMemberships).toHaveLength(2);

    expect(
      result.data.tenantMemberships.map((membership) => membership.tenantId),
    ).toEqual(['tenant-a', 'tenant-b']);

    expect(tenantUserRepository.find).toHaveBeenCalledWith({
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
  });

  it('should return only memberships for the requester tenant in TENANT scope', async () => {
    const targetUserId = 'target-user';

    userRepository.findOne.mockResolvedValue({
      id: targetUserId,
      email: 'target@test.com',
      firstName: 'Target',
      lastName: 'User',
      isActive: true,
    });

    tenantUserRepository.find.mockResolvedValue([
      {
        id: 'membership-a',
        userId: targetUserId,
        tenantId: 'tenant-a',
        status: MEMBERSHIP_STATUS.ACTIVE,
        createdAt: new Date('2026-01-01'),
        tenant: {
          id: 'tenant-a',
          name: 'Tenant A',
          slug: 'tenant-a',
          status: TENANT_STATUS.ACTIVE,
          ownerId: 'owner-a',
        },
      },
    ]);

    userRoleRepository.find.mockResolvedValue([]);

    const requester: InternalJwtPayload = {
      sub: 'gateway',
      type: 'internal',
      scope: InternalAuthScope.TENANT,
      userId: 'tenant-admin',
      tenantId: 'tenant-a',
    };

    const result = await service.getUser(requester, targetUserId);

    expect(result.data.tenantMemberships).toHaveLength(1);

    expect(result.data.tenantMemberships[0].tenantId).toBe('tenant-a');

    expect(tenantUserRepository.find).toHaveBeenCalledWith({
      where: {
        userId: targetUserId,
        tenantId: 'tenant-a',
      },
      relations: {
        tenant: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  });

  it('should return 404 when target user does not belong to requester tenant', async () => {
    const targetUserId = 'target-user';

    userRepository.findOne.mockResolvedValue({
      id: targetUserId,
      email: 'target@test.com',
      firstName: 'Target',
      lastName: 'User',
      isActive: true,
    });

    tenantUserRepository.find.mockResolvedValue([]);

    const requester: InternalJwtPayload = {
      sub: 'gateway',
      type: 'internal',
      scope: InternalAuthScope.TENANT,
      userId: 'tenant-admin',
      tenantId: 'tenant-a',
    };

    const promise = service.getUser(requester, targetUserId);

    await expect(promise).rejects.toMatchObject({
      response: {
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
      },
      status: 404,
    });
  });

  it('should return tenant roles for all tenants in GLOBAL scope', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
    });

    tenantUserRepository.find.mockResolvedValue([
      {
        id: 'membership-1',
        userId: 'user-1',
        tenantId: 'tenant-a',
        status: MEMBERSHIP_STATUS.ACTIVE,
        createdAt: new Date(),
        tenant: {
          id: 'tenant-a',
          name: 'Tenant A',
          slug: 'tenant-a',
          status: TENANT_STATUS.ACTIVE,
          ownerId: 'owner-a',
        },
      },
      {
        id: 'membership-2',
        userId: 'user-1',
        tenantId: 'tenant-b',
        status: MEMBERSHIP_STATUS.ACTIVE,
        createdAt: new Date(),
        tenant: {
          id: 'tenant-b',
          name: 'Tenant B',
          slug: 'tenant-b',
          status: TENANT_STATUS.ACTIVE,
          ownerId: 'owner-b',
        },
      },
    ]);

    userRoleRepository.find.mockResolvedValue([
      {
        userId: 'user-1',
        tenantId: 'tenant-a',
        role: {
          slug: 'TENANT_ADMIN',
          isSystem: false,
        },
      },
      {
        userId: 'user-1',
        tenantId: 'tenant-b',
        role: {
          slug: 'STAFF',
          isSystem: false,
        },
      },
    ]);

    const requester: InternalJwtPayload = {
      sub: 'gateway',
      type: 'internal',
      scope: InternalAuthScope.GLOBAL,
      userId: 'admin-1',
    };

    const result = await service.getUser(requester, 'user-1');

    expect(result.data.tenantRoles).toEqual([
      {
        tenantId: 'tenant-a',
        role: 'TENANT_ADMIN',
      },
      {
        tenantId: 'tenant-b',
        role: 'STAFF',
      },
    ]);
  });

  it('should return only tenant roles for the requester tenant in TENANT scope', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
    });

    tenantUserRepository.find.mockResolvedValue([
      {
        id: 'membership-1',
        userId: 'user-1',
        tenantId: 'tenant-a',
        status: MEMBERSHIP_STATUS.ACTIVE,
        createdAt: new Date(),
        tenant: {
          id: 'tenant-a',
          name: 'Tenant A',
          slug: 'tenant-a',
          status: TENANT_STATUS.ACTIVE,
          ownerId: 'owner-a',
        },
      },
    ]);

    userRoleRepository.find.mockResolvedValue([
      {
        userId: 'user-1',
        tenantId: 'tenant-a',
        role: {
          slug: 'TENANT_ADMIN',
          isSystem: false,
        },
      },
      {
        userId: 'user-1',
        tenantId: 'tenant-b',
        role: {
          slug: 'STAFF',
          isSystem: false,
        },
      },
    ]);

    const requester: InternalJwtPayload = {
      sub: 'gateway',
      type: 'internal',
      scope: InternalAuthScope.TENANT,
      userId: 'user-2',
      tenantId: 'tenant-a',
    };

    const result = await service.getUser(requester, 'user-1');

    expect(result.data.tenantRoles).toEqual([
      {
        tenantId: 'tenant-a',
        role: 'TENANT_ADMIN',
      },
    ]);

    expect(result.data.tenantRoles).not.toContainEqual({
      tenantId: 'tenant-b',
      role: 'STAFF',
    });
  });
});
