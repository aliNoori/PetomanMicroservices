
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '@petoman/infrastructure';
import {
  INTERNAL_JWT_OPTIONS,
  InternalAuthScope,
  InternalJwtService,
  type InternalJwtOptions,
} from '@petoman/security';
import request from 'supertest';
import sharp from 'sharp';

import { AppModule } from '../../../src/app.module';

describe('Product Image E2E', () => {
  let app: INestApplication;
  let internalJwtService: InternalJwtService;
  let internalJwtOptions: InternalJwtOptions;

  const storageMock = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(),
    download: jest.fn(),
  };

  const tenantA = 'e2e-tenant-a';
  const tenantB = 'e2e-tenant-b';

  const createTenantToken = (tenantId: string): string =>
    internalJwtService.signTenantToken(tenantId, internalJwtOptions);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue(storageMock)
      .compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    internalJwtService = app.get(InternalJwtService);
    internalJwtOptions = app.get(INTERNAL_JWT_OPTIONS);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    storageMock.upload.mockImplementation(async (options) => ({
      key: options.key,
    }));

    storageMock.delete.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createPngBuffer(): Promise<Buffer> {
    return sharp({
      create: {
        width: 64,
        height: 48,
        channels: 3,
        background: { r: 220, g: 120, b: 80 },
      },
    })
      .png()
      .toBuffer();
  }

  describe('POST /storage/products/images', () => {
    it('should upload a valid image for the authenticated tenant', async () => {
      const token = createTenantToken(tenantA);
      const imageBuffer = await createPngBuffer();

      const response = await request(app.getHttpServer())
        .post('/storage/products/images')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', imageBuffer, {
          filename: 'product.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(response.body.imageKey).toMatch(
        new RegExp(`^tenants/${tenantA}/products/.+\\.webp$`),
      );

      expect(storageMock.upload).toHaveBeenCalledTimes(1);

      const uploadOptions = storageMock.upload.mock.calls[0][0];

      expect(uploadOptions.key).toBe(response.body.imageKey);
      expect(uploadOptions.contentType).toBe('image/webp');

      const metadata = await sharp(uploadOptions.body).metadata();

      expect(metadata.format).toBe('webp');
    });

    it('should reject requests without an internal token', async () => {
      const imageBuffer = await createPngBuffer();

      await request(app.getHttpServer())
        .post('/storage/products/images')
        .attach('image', imageBuffer, {
          filename: 'product.png',
          contentType: 'image/png',
        })
        .expect(401);

      expect(storageMock.upload).not.toHaveBeenCalled();
    });

    it('should reject a GLOBAL scoped internal token', async () => {
      const token = internalJwtService.signServiceToken(
        internalJwtOptions,
      );

      const imageBuffer = await createPngBuffer();

      await request(app.getHttpServer())
        .post('/storage/products/images')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', imageBuffer, {
          filename: 'product.png',
          contentType: 'image/png',
        })
        .expect(403);

      expect(storageMock.upload).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /storage/products/images', () => {
    it('should delete an image owned by the authenticated tenant', async () => {
      const token = createTenantToken(tenantA);
      const imageKey =
        `tenants/${tenantA}/products/550e8400-e29b-41d4-a716-446655440000.webp`;

      const response = await request(app.getHttpServer())
        .delete('/storage/products/images')
        .set('Authorization', `Bearer ${token}`)
        .send({ imageKey })
        .expect(200);

      expect(response.body.deleted).toBe(true);
      expect(storageMock.delete).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).toHaveBeenCalledWith(imageKey);
    });

    it('should reject deleting another tenant image', async () => {
      const token = createTenantToken(tenantA);
      const imageKey =
        `tenants/${tenantB}/products/550e8400-e29b-41d4-a716-446655440000.webp`;

      await request(app.getHttpServer())
        .delete('/storage/products/images')
        .set('Authorization', `Bearer ${token}`)
        .send({ imageKey })
        .expect(403);

      expect(storageMock.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting an image outside the products directory', async () => {
      const token = createTenantToken(tenantA);
      const imageKey =
        `tenants/${tenantA}/avatars/550e8400-e29b-41d4-a716-446655440000.webp`;

      await request(app.getHttpServer())
        .delete('/storage/products/images')
        .set('Authorization', `Bearer ${token}`)
        .send({ imageKey })
        .expect(403);

      expect(storageMock.delete).not.toHaveBeenCalled();
    });

    it('should reject requests without an internal token', async () => {
      const imageKey =
        `tenants/${tenantA}/products/550e8400-e29b-41d4-a716-446655440000.webp`;

      await request(app.getHttpServer())
        .delete('/storage/products/images')
        .send({ imageKey })
        .expect(401);

      expect(storageMock.delete).not.toHaveBeenCalled();
    });
  });
});
