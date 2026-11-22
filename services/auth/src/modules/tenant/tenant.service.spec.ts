import { ForbiddenException } from '@nestjs/common';

import { TenantService } from './tenant.service';
import { TENANT_STATUS } from '../../common/constants/tenant.constants';
import { InternalAuthScope } from '@petoman/security';

describe('TenantService', () => {
  let service: TenantService;

  const tenantRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const userRepository = {
    findOne: jest.fn(),
  };

  const dataSource = {};

  const tenantUserRepository = {
    findByTenantId: jest.fn(),
    findActiveMembership: jest.fn(),
  };

  const tenant = {
    id: 'tenant-a',
    name: 'Tenant A',
    slug: 'tenant-a',
    type: 'STORE',
    status: TENANT_STATUS.ACTIVE,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository.findOne.mockReset();

    service = new TenantService(
      dataSource as any,
      tenantRepository as any,
      userRepository as any,
      tenantUserRepository as any,
    );
  });

  describe('findActiveTenants', () => {
    it('should return only active tenants with public fields', async () => {
      const activeTenants = [
        {
          id: 'tenant-a',
          name: 'Tenant A',
          slug: 'tenant-a',
        },
        {
          id: 'tenant-b',
          name: 'Tenant B',
          slug: 'tenant-b',
        },
      ];

      tenantRepository.find.mockResolvedValue(activeTenants);

      const result = await service.findActiveTenants();

      expect(result).toEqual(activeTenants);

      expect(tenantRepository.find).toHaveBeenCalledWith({
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
    });

    it('should return an empty array when there are no active tenants', async () => {
      tenantRepository.find.mockResolvedValue([]);

      const result = await service.findActiveTenants();

      expect(result).toEqual([]);
    });
  });

  describe('getTenantMemberships', () => {
    const tenantId = 'tenant-a';

    const memberships = [
      {
        id: 'membership-a',
        tenantId,
        userId: 'user-a',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        user: {
          id: 'user-a',
          email: 'user@example.com',
          firstName: 'Ali',
          lastName: 'Noori',
          avatarKey: 'avatar-a',
          isActive: true,
          passwordHash: 'must-not-be-exposed',
          userRoles: [
            {
              tenantId,
              role: {
                id: 'role-a',
                name: 'Tenant Admin',
                slug: 'tenant-admin',
              },
            },
            {
              tenantId: null,
              role: {
                id: 'system-role',
                name: 'System Admin',
                slug: 'system-admin',
              },
            },
            {
              tenantId: 'tenant-b',
              role: {
                id: 'other-role',
                name: 'Other Tenant Role',
                slug: 'other-role',
              },
            },
          ],
        },
      },
    ];

    beforeEach(() => {
      tenantRepository.findOne.mockResolvedValue(tenant);
      tenantUserRepository.findByTenantId.mockResolvedValue(memberships);
      tenantUserRepository.findActiveMembership.mockResolvedValue({
        id: 'membership-a',
      });
    });

    it('should return memberships with safe user details and tenant roles for GLOBAL scope', async () => {
      const requester = {
        scope: InternalAuthScope.GLOBAL,
      } as any;

      const result = await service.getTenantMemberships(requester, tenantId);

      expect(result.success).toBe(true);

      expect(result.data.tenant).toEqual({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        status: tenant.status,
      });

      expect(result.data.memberships).toHaveLength(1);

      expect(result.data.memberships[0]).toEqual({
        membershipId: 'membership-a',
        tenantId,
        userId: 'user-a',
        status: 'ACTIVE',
        createdAt: memberships[0].createdAt,
        user: {
          id: 'user-a',
          email: 'user@example.com',
          firstName: 'Ali',
          lastName: 'Noori',
          avatarKey: 'avatar-a',
          isActive: true,
        },
        roles: [
          {
            roleId: 'role-a',
            name: 'Tenant Admin',
            slug: 'tenant-admin',
          },
        ],
      });

      expect(result.data.memberships[0].user).not.toHaveProperty(
        'passwordHash',
      );

      expect(tenantUserRepository.findActiveMembership).not.toHaveBeenCalled();

      expect(tenantUserRepository.findByTenantId).toHaveBeenCalledWith(
        tenantId,
      );
    });

    it('should allow TENANT scope with an active membership', async () => {
      const requester = {
        scope: InternalAuthScope.TENANT,
        tenantId,
        userId: 'user-a',
      } as any;

      const result = await service.getTenantMemberships(requester, tenantId);

      expect(result.success).toBe(true);

      expect(tenantUserRepository.findActiveMembership).toHaveBeenCalledWith(
        tenantId,
        'user-a',
      );

      expect(tenantUserRepository.findByTenantId).toHaveBeenCalledWith(
        tenantId,
      );
    });

    it('should reject TENANT scope when the tenant is inactive', async () => {
      tenantRepository.findOne.mockResolvedValue({
        ...tenant,
        status: TENANT_STATUS.PENDING,
      });

      const requester = {
        scope: InternalAuthScope.TENANT,
        tenantId,
        userId: 'user-a',
      } as any;

      await expect(
        service.getTenantMemberships(requester, tenantId),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(tenantUserRepository.findActiveMembership).not.toHaveBeenCalled();

      expect(tenantUserRepository.findByTenantId).not.toHaveBeenCalled();
    });

    it('should reject access to a different tenant', async () => {
      const requester = {
        scope: InternalAuthScope.TENANT,
        tenantId: 'tenant-b',
        userId: 'user-a',
      } as any;

      await expect(
        service.getTenantMemberships(requester, tenantId),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(tenantUserRepository.findActiveMembership).not.toHaveBeenCalled();

      expect(tenantUserRepository.findByTenantId).not.toHaveBeenCalled();
    });

    it('should reject TENANT scope without an active membership', async () => {
      const requester = {
        scope: InternalAuthScope.TENANT,
        tenantId,
        userId: 'user-a',
      } as any;

      tenantUserRepository.findActiveMembership.mockResolvedValue(null);

      await expect(
        service.getTenantMemberships(requester, tenantId),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(tenantUserRepository.findByTenantId).not.toHaveBeenCalled();
    });

    it('should throw when the tenant does not exist', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      const requester = {
        scope: InternalAuthScope.GLOBAL,
      } as any;

      await expect(
        service.getTenantMemberships(requester, tenantId),
      ).rejects.toThrow();

      expect(tenantUserRepository.findByTenantId).not.toHaveBeenCalled();
    });
  });

  describe('validateTenantContext', () => {
    const userId = 'user-a';
    const tenantId = 'tenant-a';

    beforeEach(() => {
      userRepository.findOne.mockResolvedValue({
        id: userId,
        isActive: true,
      });

      tenantRepository.findOne.mockResolvedValue({
        id: tenantId,
        status: TENANT_STATUS.ACTIVE,
      });

      tenantUserRepository.findActiveMembership.mockResolvedValue({
        id: 'membership-a',
        userId,
        tenantId,
        status: 'ACTIVE',
      });
    });

    it('should validate an active user, tenant, and membership', async () => {
      await expect(
        service.validateTenantContext(userId, tenantId),
      ).resolves.toBeUndefined();

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          isActive: true,
        },
      });

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: tenantId },
        select: {
          id: true,
          status: true,
        },
      });

      expect(tenantUserRepository.findActiveMembership).toHaveBeenCalledWith(
        tenantId,
        userId,
      );
    });

    it('should reject an inactive user', async () => {
      userRepository.findOne.mockResolvedValue({
        id: userId,
        isActive: false,
      });

      await expect(
        service.validateTenantContext(userId, tenantId),
      ).rejects.toThrow(ForbiddenException);

      expect(tenantRepository.findOne).not.toHaveBeenCalled();
      expect(tenantUserRepository.findActiveMembership).not.toHaveBeenCalled();
    });

    it('should reject an inactive tenant', async () => {
      tenantRepository.findOne.mockResolvedValue({
        id: tenantId,
        status: TENANT_STATUS.PENDING,
      });

      await expect(
        service.validateTenantContext(userId, tenantId),
      ).rejects.toThrow(ForbiddenException);

      expect(tenantUserRepository.findActiveMembership).not.toHaveBeenCalled();
    });

    it('should reject a user without active membership', async () => {
      tenantUserRepository.findActiveMembership.mockResolvedValue(null);

      await expect(
        service.validateTenantContext(userId, tenantId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
