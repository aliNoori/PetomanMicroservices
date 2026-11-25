
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

import { StorageService } from '@petoman/infrastructure';
import { InternalAuthScope, type InternalJwtPayload } from '@petoman/security';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 20_000_000;
const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 82;

const ALLOWED_IMAGE_FORMATS = ['jpeg', 'png', 'webp'] as const;

interface ProductImageFile {
  readonly buffer: Buffer;
  readonly size: number;
}

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);

  constructor(
    private readonly storageService: StorageService,
  ) {}

  async upload(
    file: ProductImageFile | undefined,
    internalAuth?: InternalJwtPayload,
  ): Promise<{ imageKey: string }> {
    const tenantId = this.requireTenant(internalAuth);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Product image is required.');
    }

    if (
      !Number.isInteger(file.size) ||
      file.size <= 0 ||
      file.size > MAX_IMAGE_SIZE ||
      file.buffer.length > MAX_IMAGE_SIZE
    ) {
      throw new BadRequestException(
        'Product image must not exceed 5 MB.',
      );
    }

    let imageBuffer: Buffer;

    try {
      const image = sharp(file.buffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: 'error',
      });

      const metadata = await image.metadata();

      if (
        !metadata.format ||
        !ALLOWED_IMAGE_FORMATS.includes(
          metadata.format as (typeof ALLOWED_IMAGE_FORMATS)[number],
        )
      ) {
        throw new BadRequestException(
          'Only JPEG, PNG, and WebP images are allowed.',
        );
      }

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Invalid image dimensions.');
      }

      imageBuffer = await sharp(file.buffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: 'error',
      })
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.warn('Product image processing failed.');

      throw new BadRequestException(
        'The uploaded product image is invalid or unsupported.',
      );
    }

    const key = `tenants/${tenantId}/products/${randomUUID()}.webp`;

    const result = await this.storageService.upload({
      key,
      body: imageBuffer,
      contentType: 'image/webp',
      cacheControl: 'private, max-age=300',
    });

    return { imageKey: result.key };
  }

  async delete(
    imageKey: string,
    internalAuth?: InternalJwtPayload,
  ): Promise<{ deleted: boolean }> {
    const tenantId = this.requireTenant(internalAuth);

    if (!this.isOwnedProductImageKey(imageKey, tenantId)) {
      throw new ForbiddenException(
        'You are not allowed to delete this image.',
      );
    }

    await this.storageService.delete(imageKey);

    return { deleted: true };
  }

  private requireTenant(
    internalAuth?: InternalJwtPayload,
  ): string {
    if (!internalAuth) {
      throw new UnauthorizedException(
        'Internal authentication is required.',
      );
    }

    if (
      internalAuth.scope !== InternalAuthScope.TENANT ||
      !internalAuth.tenantId
    ) {
      throw new ForbiddenException(
        'Tenant-scoped authentication is required.',
      );
    }

    return internalAuth.tenantId;
  }

  private isOwnedProductImageKey(
    imageKey: string,
    tenantId: string,
  ): boolean {
    if (typeof imageKey !== 'string' || imageKey.length > 512) {
      return false;
    }

    const segments = imageKey.split('/');

    if (segments.length !== 4) {
      return false;
    }

    const [root, keyTenantId, resource, filename] = segments;

    if (
      root !== 'tenants' ||
      keyTenantId !== tenantId ||
      resource !== 'products'
    ) {
      return false;
    }

    const uuid = filename.match(
      /^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.webp$/i,
    );

    return Boolean(uuid);
  }
}
