import { ForbiddenException } from '@nestjs/common';

import {
  InternalAuthScope,
  type InternalAuthenticatedRequest,
} from '@petoman/security';

import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantController - findActiveTenants', () => {
  let controller: TenantController;

  const tenantService = {
    findActiveTenants: jest.fn(),
    findBySlug: jest.fn(),
    validateTenantContext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new TenantController(
      tenantService as unknown as TenantService,
    );
  });

  it('should return active tenants for a global service token', async () => {
    const tenants = [
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

    tenantService.findActiveTenants.mockResolvedValue(tenants);

    const request = {
      internalAuth: {
        sub: 'gateway',
        type: 'internal',
        scope: InternalAuthScope.GLOBAL,
      },
    } as InternalAuthenticatedRequest;

    const result = await controller.findActiveTenants(request);

    expect(result).toEqual({
      success: true,
      data: tenants,
    });

    expect(tenantService.findActiveTenants).toHaveBeenCalledTimes(1);
  });

  it('should reject a global user token', async () => {
    const request = {
      internalAuth: {
        sub: 'gateway',
        type: 'internal',
        scope: InternalAuthScope.GLOBAL,
        userId: 'user-1',
        sid: 'session-1',
        roles: ['SUPER_ADMIN'],
        permissions: [],
      },
    } as unknown as InternalAuthenticatedRequest;

    await expect(controller.findActiveTenants(request)).rejects.toThrow(
      ForbiddenException,
    );

    expect(tenantService.findActiveTenants).not.toHaveBeenCalled();
  });

  it('should reject a tenant-scoped service token', async () => {
    const request = {
      internalAuth: {
        sub: 'gateway',
        type: 'internal',
        scope: InternalAuthScope.TENANT,
        tenantId: 'tenant-a',
      },
    } as InternalAuthenticatedRequest;

    await expect(controller.findActiveTenants(request)).rejects.toThrow(
      ForbiddenException,
    );

    expect(tenantService.findActiveTenants).not.toHaveBeenCalled();
  });

  it('should reject a request without internal authentication', async () => {
    const request = {} as InternalAuthenticatedRequest;

    await expect(controller.findActiveTenants(request)).rejects.toThrow(
      ForbiddenException,
    );

    expect(tenantService.findActiveTenants).not.toHaveBeenCalled();
  });

  describe('TenantController - findBySlug', () => {
    it('should return tenant for a global service token', async () => {
      const tenant = {
        id: 'tenant-a',
        status: 'ACTIVE',
      };

      tenantService.findBySlug.mockResolvedValue(tenant);

      const request = {
        internalAuth: {
          sub: 'gateway',
          type: 'internal',
          scope: InternalAuthScope.GLOBAL,
        },
      } as InternalAuthenticatedRequest;

      const result = await controller.findBySlug('tenant-a', request);

      expect(result).toEqual({
        id: tenant.id,
        status: tenant.status,
      });

      expect(tenantService.findBySlug).toHaveBeenCalledWith('tenant-a');
    });

    it('should reject a global user token', async () => {
      const request = {
        internalAuth: {
          sub: 'gateway',
          type: 'internal',
          scope: InternalAuthScope.GLOBAL,
          userId: 'user-a',
          sid: 'session-a',
          roles: ['SUPER_ADMIN'],
          permissions: [],
        },
      } as unknown as InternalAuthenticatedRequest;

      await expect(controller.findBySlug('tenant-a', request)).rejects.toThrow(
        ForbiddenException,
      );

      expect(tenantService.findBySlug).not.toHaveBeenCalled();
    });

    it('should reject a tenant-scoped token', async () => {
      const request = {
        internalAuth: {
          sub: 'gateway',
          type: 'internal',
          scope: InternalAuthScope.TENANT,
          tenantId: 'tenant-a',
        },
      } as InternalAuthenticatedRequest;

      await expect(controller.findBySlug('tenant-a', request)).rejects.toThrow(
        ForbiddenException,
      );

      expect(tenantService.findBySlug).not.toHaveBeenCalled();
    });

    it('should reject a request without internal authentication', async () => {
      const request = {} as InternalAuthenticatedRequest;

      await expect(controller.findBySlug('tenant-a', request)).rejects.toThrow(
        ForbiddenException,
      );

      expect(tenantService.findBySlug).not.toHaveBeenCalled();
    });
  });

  describe('TenantController - validateTenantContext', () => {
    const userId = 'user-a';
    const tenantId = 'tenant-a';

    const dto = { userId, tenantId };

    it('should validate context for a global service token', async () => {
      tenantService.validateTenantContext.mockResolvedValue(undefined);

      const request = {
        internalAuth: {
          sub: 'gateway',
          type: 'internal',
          scope: InternalAuthScope.GLOBAL,
        },
      } as InternalAuthenticatedRequest;

      const result = await controller.validateTenantContext(dto, request);

      expect(result).toEqual({
        success: true,
        data: { valid: true },
      });

      expect(tenantService.validateTenantContext).toHaveBeenCalledWith(
        userId,
        tenantId,
      );
    });

    it('should reject a global user token', async () => {
      const request = {
        internalAuth: {
          sub: 'gateway',
          type: 'internal',
          scope: InternalAuthScope.GLOBAL,
          userId: 'admin-a',
          sid: 'session-a',
          roles: ['SUPER_ADMIN'],
          permissions: [],
        },
      } as unknown as InternalAuthenticatedRequest;

      await expect(
        controller.validateTenantContext(dto, request),
      ).rejects.toThrow(ForbiddenException);

      expect(tenantService.validateTenantContext).not.toHaveBeenCalled();
    });

    it('should reject a tenant-scoped token', async () => {
      const request = {
        internalAuth: {
          sub: 'gateway',
          type: 'internal',
          scope: InternalAuthScope.TENANT,
          userId,
          tenantId,
          sid: 'session-a',
          roles: [],
          permissions: [],
        },
      } as unknown as InternalAuthenticatedRequest;

      await expect(
        controller.validateTenantContext(dto, request),
      ).rejects.toThrow(ForbiddenException);

      expect(tenantService.validateTenantContext).not.toHaveBeenCalled();
    });

    it('should reject a request without internal authentication', async () => {
      const request = {} as InternalAuthenticatedRequest;

      await expect(
        controller.validateTenantContext(dto, request),
      ).rejects.toThrow(ForbiddenException);

      expect(tenantService.validateTenantContext).not.toHaveBeenCalled();
    });
  });
});
