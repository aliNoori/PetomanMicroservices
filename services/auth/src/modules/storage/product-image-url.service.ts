
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { StorageService } from '@petoman/infrastructure';
import {
  InternalAuthScope,
  type InternalJwtPayload,
} from '@petoman/security';

import { TenantService } from '../tenant/tenant.service';

const PRODUCT_IMAGE_KEY_PATTERN =
  /^tenants\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/products\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;

export interface SignedProductImage {
  readonly imageKey: string;
  readonly imageUrl: string;
}

@Injectable()
export class ProductImageUrlService {
  constructor(
    private readonly storageService: StorageService,
    private readonly tenantService: TenantService,
  ) {}

  async sign(
    imageKeys: readonly string[],
    internalAuth?: InternalJwtPayload,
  ): Promise<{ images: SignedProductImage[] }> {
    this.requireAuthentication(internalAuth);

    if (
      !Array.isArray(imageKeys) ||
      imageKeys.length === 0 ||
      imageKeys.length > 100
    ) {
      throw new ForbiddenException(
        'Invalid product image signing request.',
      );
    }

    const parsedKeys = imageKeys.map((imageKey) => {
      if (
        typeof imageKey !== 'string' ||
        imageKey.length > 512
      ) {
        throw new ForbiddenException(
          'Invalid product image key.',
        );
      }

      const match = imageKey.match(PRODUCT_IMAGE_KEY_PATTERN);

      if (!match) {
        throw new ForbiddenException(
          'Invalid product image key.',
        );
      }

      return {
        imageKey,
        tenantId: match[1],
      };
    });

    const allowedTenantIds =
      await this.resolveAllowedTenantIds(internalAuth!);

    for (const item of parsedKeys) {
      if (!allowedTenantIds.has(item.tenantId)) {
        throw new ForbiddenException(
          'You are not allowed to access this product image.',
        );
      }
    }

    const images = await Promise.all(
      parsedKeys.map(async ({ imageKey }) => ({
        imageKey,
        imageUrl: await this.storageService.getSignedUrl(imageKey),
      })),
    );

    return { images };
  }

  private requireAuthentication(
    internalAuth?: InternalJwtPayload,
  ): asserts internalAuth is InternalJwtPayload {
    if (!internalAuth) {
      throw new UnauthorizedException(
        'Internal authentication is required.',
      );
    }

    if (
      internalAuth.scope !== InternalAuthScope.TENANT &&
      internalAuth.scope !== InternalAuthScope.GLOBAL
    ) {
      throw new ForbiddenException(
        'This internal authentication scope cannot sign product images.',
      );
    }
  }

  private async resolveAllowedTenantIds(
    internalAuth: InternalJwtPayload,
  ): Promise<Set<string>> {
    if (internalAuth.scope === InternalAuthScope.TENANT) {
      if (!internalAuth.tenantId) {
        throw new ForbiddenException(
          'Tenant context is required.',
        );
      }

      return new Set([internalAuth.tenantId]);
    }

    const tenants = await this.tenantService.findActiveTenants();

    return new Set(tenants.map((tenant) => tenant.id));
  }
}
