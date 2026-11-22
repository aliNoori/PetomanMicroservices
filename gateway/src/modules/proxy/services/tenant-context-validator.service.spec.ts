import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InternalJwtService } from '@petoman/security';

import { TenantContextValidatorService } from './tenant-context-validator.service';

describe('TenantContextValidatorService', () => {
  let service: TenantContextValidatorService;

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

    service = new TenantContextValidatorService(
      configService,
      internalJwtService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should validate an active tenant context', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { valid: true },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await expect(
      service.validate('user-001', 'tenant-001'),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/tenants/validate-context',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-internal-token',
        },
        body: JSON.stringify({
          userId: 'user-001',
          tenantId: 'tenant-001',
        }),
      },
    );
  });

  it('should create an internal service token', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { valid: true },
        }),
        { status: 200 },
      ),
    );

    await service.validate('user-001', 'tenant-001');

    expect(internalJwtService.signServiceToken).toHaveBeenCalledTimes(1);

    expect(internalJwtService.signServiceToken).toHaveBeenCalledWith({
      secret: 'test-internal-secret',
      issuer: 'petoman-gateway',
      audience: 'petoman-auth',
      expiresInSeconds: 60,
    });
  });

  it('should reject when Auth service returns 403 or 404', async () => {
    for (const status of [403, 404]) {
      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(null, { status }),
      );

      await expect(
        service.validate('user-001', 'tenant-001'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('should handle Auth service network failure', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      service.validate('user-001', 'tenant-001'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should handle downstream server errors', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    await expect(
      service.validate('user-001', 'tenant-001'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should reject an invalid JSON response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('invalid-json', { status: 200 }),
    );

    await expect(
      service.validate('user-001', 'tenant-001'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should reject an invalid tenant context response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { valid: false },
        }),
        { status: 200 },
      ),
    );

    await expect(
      service.validate('user-001', 'tenant-001'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
