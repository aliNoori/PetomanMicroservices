import { ConfigService } from '@nestjs/config';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { TenantResolverService } from './tenant-resolver.service';
import { InternalJwtService } from '@petoman/security';

describe('TenantResolverService', () => {
  let service: TenantResolverService;

  const configValues = {
    'services.auth.url': 'http://localhost:3001',
    'internalJwt.secret': 'test-internal-secret',
    'internalJwt.issuer': 'petoman-gateway',
    'internalJwt.authAudience': 'petoman-auth',
    'internalJwt.expiresInSeconds': 60,
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const value = configValues[key as keyof typeof configValues];

      if (value === undefined) {
        throw new Error(`Missing config: ${key}`);
      }

      return value;
    }),
  } as unknown as ConfigService;

  const internalJwtService = {
    signServiceToken: jest.fn(),
  } as unknown as InternalJwtService;

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .mocked(internalJwtService.signServiceToken)
      .mockReturnValue('test-internal-token');

    service = new TenantResolverService(configService, internalJwtService);
  });

  it('should resolve a tenant by slug', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'tenant-001',
          status: 'ACTIVE',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const result = await service.resolveBySlug('store-001');

    expect(result).toEqual({
      tenantId: 'tenant-001',
      status: 'ACTIVE',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/tenants/by-slug/store-001',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer test-internal-token',
        },
      },
    );
  });

  it('should create an internal service token', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'tenant-001',
          status: 'ACTIVE',
        }),
        { status: 200 },
      ),
    );

    await service.resolveBySlug('store-001');

    expect(internalJwtService.signServiceToken).toHaveBeenCalledTimes(1);

    expect(internalJwtService.signServiceToken).toHaveBeenCalledWith({
      secret: 'test-internal-secret',
      issuer: 'petoman-gateway',
      audience: 'petoman-auth',
      expiresInSeconds: 60,
    });
  });

  it('should reject when tenant is not found', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 404,
      }),
    );

    await expect(service.resolveBySlug('unknown-store')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should handle auth service network failure', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.resolveBySlug('store-001')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should handle downstream auth errors', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 500,
      }),
    );

    await expect(service.resolveBySlug('store-001')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should reject an invalid tenant response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 123,
          status: 'ACTIVE',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await expect(service.resolveBySlug('store-001')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should encode the store slug in the request URL', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'tenant-001',
          status: 'ACTIVE',
        }),
        { status: 200 },
      ),
    );

    await service.resolveBySlug('my store/branch');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/tenants/by-slug/my%20store%2Fbranch',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
  it('should resolve active tenants', async () => {
    const tenants = [
      {
        id: 'tenant-001',
        name: 'Store One',
        slug: 'store-one',
      },
      {
        id: 'tenant-002',
        name: 'Store Two',
        slug: 'store-two',
      },
    ];

    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: tenants,
        }),
        { status: 200 },
      ),
    );

    const result = await service.resolveActiveTenants();

    expect(result).toEqual(tenants);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/tenants/active',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer test-internal-token',
        },
      },
    );
  });

  it('should return an empty array when no active tenants exist', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [],
        }),
        { status: 200 },
      ),
    );

    await expect(service.resolveActiveTenants()).resolves.toEqual([]);
  });

  it('should reject an invalid active tenants response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 'tenant-001',
              name: 'Store One',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(service.resolveActiveTenants()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
