
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  InternalAuthScope,
  type InternalJwtPayload,
} from '@petoman/security';

import { StorageService } from '@petoman/infrastructure';
import { TenantService } from '../tenant/tenant.service';

import { ProductImageUrlService } from './product-image-url.service';

describe('ProductImageUrlService', () => {
  let service: ProductImageUrlService;

  let storageService: {
    getSignedUrl: jest.Mock;
  };

  let tenantService: {
    findActiveTenants: jest.Mock;
  };

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const imageId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const tenantAImage =
    `tenants/${tenantA}/products/${imageId}.webp`;

  const tenantBImage =
    `tenants/${tenantB}/products/${imageId}.webp`;

  const createAuth = (
    scope: InternalAuthScope,
    tenantId?: string,
  ): InternalJwtPayload => ({
    sub: 'gateway',
    type: 'internal',
    scope,
    ...(tenantId ? { tenantId } : {}),
  });

  beforeEach(() => {
    storageService = {
      getSignedUrl: jest.fn().mockImplementation(
        async (key: string) => `https://storage.test/${key}`,
      ),
    };

    tenantService = {
      findActiveTenants: jest.fn().mockResolvedValue([
        { id: tenantA },
        { id: tenantB },
      ]),
    };

    service = new ProductImageUrlService(
      storageService as unknown as StorageService,
      tenantService as unknown as TenantService,
    );
  });

  it('signs images belonging to the authenticated tenant', async () => {
    const result = await service.sign(
      [tenantAImage],
      createAuth(InternalAuthScope.TENANT, tenantA),
    );

    expect(result.images).toHaveLength(1);
    expect(result.images[0].imageKey).toBe(tenantAImage);
    expect(result.images[0].imageUrl).toContain(tenantAImage);

    expect(storageService.getSignedUrl).toHaveBeenCalledTimes(1);
    expect(tenantService.findActiveTenants).not.toHaveBeenCalled();
  });

  it('rejects images belonging to another tenant', async () => {
    await expect(
      service.sign(
        [tenantBImage],
        createAuth(InternalAuthScope.TENANT, tenantA),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(storageService.getSignedUrl).not.toHaveBeenCalled();
  });

  it('allows GLOBAL scope to sign images of active tenants', async () => {
    const result = await service.sign(
      [tenantAImage, tenantBImage],
      createAuth(InternalAuthScope.GLOBAL),
    );

    expect(result.images).toHaveLength(2);
    expect(tenantService.findActiveTenants).toHaveBeenCalledTimes(1);
    expect(storageService.getSignedUrl).toHaveBeenCalledTimes(2);
  });

  it('rejects GLOBAL access to inactive or unknown tenants', async () => {
    const unknownTenantImage =
      `tenants/33333333-3333-4333-8333-333333333333/products/${imageId}.webp`;

    await expect(
      service.sign(
        [unknownTenantImage],
        createAuth(InternalAuthScope.GLOBAL),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(storageService.getSignedUrl).not.toHaveBeenCalled();
  });

  it('rejects NO_TENANT scope', async () => {
    await expect(
      service.sign(
        [tenantAImage],
        createAuth(InternalAuthScope.NO_TENANT),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing internal authentication', async () => {
    await expect(
      service.sign([tenantAImage]),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid image keys', async () => {
    await expect(
      service.sign(
        ['invalid/image.webp'],
        createAuth(InternalAuthScope.TENANT, tenantA),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(storageService.getSignedUrl).not.toHaveBeenCalled();
  });

  it('rejects empty batches', async () => {
    await expect(
      service.sign(
        [],
        createAuth(InternalAuthScope.TENANT, tenantA),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects batches larger than 100 images', async () => {
    await expect(
      service.sign(
        Array(101).fill(tenantAImage),
        createAuth(InternalAuthScope.TENANT, tenantA),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(storageService.getSignedUrl).not.toHaveBeenCalled();
  });

  it('does not sign any image when a batch contains an unauthorized key', async () => {
    await expect(
      service.sign(
        [tenantAImage, tenantBImage],
        createAuth(InternalAuthScope.TENANT, tenantA),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(storageService.getSignedUrl).not.toHaveBeenCalled();
  });
});
