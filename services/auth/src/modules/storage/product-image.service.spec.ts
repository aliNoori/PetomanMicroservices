import {
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

import { InternalAuthScope } from '@petoman/security';
import { StorageService } from '@petoman/infrastructure';

import { ProductImageService } from './product-image.service';

describe('ProductImageService', () => {
  let service: ProductImageService;
  let storageService: {
    upload: jest.Mock;
    delete: jest.Mock;
  };

  const tenantId = 'tenant-1';

  const tenantAuth = {
    sub: 'gateway' as const,
    type: 'internal' as const,
    scope: InternalAuthScope.TENANT,
    userId: 'user-1',
    tenantId,
    sid: 'session-1',
    roles: ['TENANT_ADMIN'],
    permissions: ['market.products.manage'],
  };

  async function createPngBuffer(): Promise<Buffer> {
    return sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();
  }

  beforeEach(() => {
    jest.clearAllMocks();

    storageService = {
      upload: jest.fn(async ({ key }) => ({ key })),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    service = new ProductImageService(
      storageService as unknown as StorageService,
    );
  });

  describe('upload', () => {
    it('should process and upload a valid image', async () => {
      const buffer = await createPngBuffer();

      const result = await service.upload(
        { buffer, size: buffer.length },
        tenantAuth,
      );

      expect(result.imageKey).toMatch(
        new RegExp(`^tenants/${tenantId}/products/[0-9a-f-]+\\.webp$`),
      );

      expect(storageService.upload).toHaveBeenCalledTimes(1);

      const uploadOptions = storageService.upload.mock.calls[0][0];

      expect(uploadOptions.key).toBe(result.imageKey);
      expect(uploadOptions.contentType).toBe('image/webp');
      expect(uploadOptions.body).toBeInstanceOf(Buffer);

      const metadata = await sharp(uploadOptions.body).metadata();

      expect(metadata.format).toBe('webp');
    });

    it('should reject an empty image', async () => {
      await expect(
        service.upload({ buffer: Buffer.alloc(0), size: 0 }, tenantAuth),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('should reject an image larger than 5 MB', async () => {
      const buffer = Buffer.alloc(5 * 1024 * 1024 + 1);

      await expect(
        service.upload({ buffer, size: buffer.length }, tenantAuth),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('should reject an invalid image', async () => {
      const buffer = Buffer.from('not-an-image');

      await expect(
        service.upload({ buffer, size: buffer.length }, tenantAuth),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('should reject requests without internal authentication', async () => {
      const buffer = await createPngBuffer();

      await expect(
        service.upload({ buffer, size: buffer.length }, undefined),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('should reject authentication without tenant scope', async () => {
      const buffer = await createPngBuffer();

      await expect(
        service.upload(
          { buffer, size: buffer.length },
          {
            ...tenantAuth,
            scope: InternalAuthScope.NO_TENANT,
            tenantId: undefined,
          },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(storageService.upload).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an image belonging to the authenticated tenant', async () => {
      const imageKey = `tenants/${tenantId}/products/${randomUUID()}.webp`;

      const result = await service.delete(imageKey, tenantAuth);

      expect(result).toEqual({ deleted: true });
      expect(storageService.delete).toHaveBeenCalledWith(imageKey);
    });

    it('should reject deleting another tenant image', async () => {
      const imageKey = `tenants/another-tenant/products/${randomUUID()}.webp`;

      await expect(service.delete(imageKey, tenantAuth)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting an image outside the products directory', async () => {
      const imageKey = `users/user-1/avatar/${randomUUID()}.webp`;

      await expect(service.delete(imageKey, tenantAuth)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting an image without tenant authentication', async () => {
      const imageKey = `tenants/${tenantId}/products/${randomUUID()}.webp`;

      await expect(service.delete(imageKey, undefined)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(storageService.delete).not.toHaveBeenCalled();
    });
    it('should reject deleting an image from another resource directory', async () => {
      const imageKey = `tenants/${tenantId}/avatars/${randomUUID()}.webp`;

      await expect(service.delete(imageKey, tenantAuth)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting an image with an invalid filename', async () => {
      const imageKey = `tenants/${tenantId}/products/invalid-image.webp`;

      await expect(service.delete(imageKey, tenantAuth)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(storageService.delete).not.toHaveBeenCalled();
    });
  });
});
