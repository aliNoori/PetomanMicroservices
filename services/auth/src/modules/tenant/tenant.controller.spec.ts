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
    } as InternalAuthenticatedRequest;

    await expect(
      controller.findActiveTenants(request),
    ).rejects.toThrow(ForbiddenException);

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

    await expect(
      controller.findActiveTenants(request),
    ).rejects.toThrow(ForbiddenException);

    expect(tenantService.findActiveTenants).not.toHaveBeenCalled();
  });

  it('should reject a request without internal authentication', async () => {
    const request = {} as InternalAuthenticatedRequest;

    await expect(
      controller.findActiveTenants(request),
    ).rejects.toThrow(ForbiddenException);

    expect(tenantService.findActiveTenants).not.toHaveBeenCalled();
  });
});