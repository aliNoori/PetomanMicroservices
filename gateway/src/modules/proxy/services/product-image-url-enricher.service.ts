import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ServiceConfig {
  readonly url: string;
  readonly timeoutMs: number;
}

interface SignedProductImage {
  readonly imageKey: string;
  readonly imageUrl: string;
}

interface SignedProductImagesResponse {
  readonly images: SignedProductImage[];
}

type ProductRecord = Record<string, unknown>;

type EnrichedProduct<T extends ProductRecord> = Omit<T, 'image_key'> & {
  image_url: string | null;
};

type EnrichedResponse<T> = T extends {
  data: {
    products: Array<infer P>;
  };
}
  ? Omit<T, 'data'> & {
      data: Omit<T['data'], 'products'> & {
        products: P extends ProductRecord
          ? EnrichedProduct<P>[]
          : ProductRecord[];
      };
    }
  : T extends {
        data: {
          product: infer P;
        };
      }
    ? Omit<T, 'data'> & {
        data: Omit<T['data'], 'product'> & {
          product: P extends ProductRecord ? EnrichedProduct<P> : ProductRecord;
        };
      }
    : T;

@Injectable()
export class ProductImageUrlEnricherService {
  private readonly batchSize = 100;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async enrich<T>(
    response: T,
    authorization: string,
  ): Promise<EnrichedResponse<T>> {
    if (!this.isRecord(response) || !this.isRecord(response.data)) {
      return response as EnrichedResponse<T>;
    }

    const data = response.data;

    if (Array.isArray(data.products)) {
      const products = data.products.filter((item): item is ProductRecord =>
        this.isRecord(item),
      );

      const enriched = await this.enrichProducts(products, authorization);

      return {
        ...response,
        data: {
          ...data,
          products: enriched,
        },
      } as EnrichedResponse<T>;
    }

    if (this.isRecord(data.product)) {
      const [product] = await this.enrichProducts(
        [data.product],
        authorization,
      );

      return {
        ...response,
        data: {
          ...data,
          product,
        },
      } as EnrichedResponse<T>;
    }

    return response as EnrichedResponse<T>;
  }

  private async enrichProducts(
    products: ProductRecord[],
    authorization: string,
  ): Promise<ProductRecord[]> {
    const imageKeys = [
      ...new Set(
        products
          .map((product) => product.image_key)
          .filter(
            (key): key is string =>
              typeof key === 'string' && key.trim().length > 0,
          ),
      ),
    ];

    const imageUrls = await this.signImageKeys(imageKeys, authorization);

    return products.map((product) => {
      const imageKey =
        typeof product.image_key === 'string' ? product.image_key : undefined;

      const { image_key: _imageKey, ...safeProduct } = product;

      return {
        ...safeProduct,
        image_url: imageKey ? (imageUrls.get(imageKey) ?? null) : null,
      };
    });
  }

  private async signImageKeys(
    imageKeys: string[],
    authorization: string,
  ): Promise<Map<string, string>> {
    const imageUrls = new Map<string, string>();

    if (imageKeys.length === 0) {
      return imageUrls;
    }

    const service = this.getAuthServiceConfig();

    for (let index = 0; index < imageKeys.length; index += this.batchSize) {
      const batch = imageKeys.slice(index, index + this.batchSize);

      try {
        const response = await firstValueFrom(
          this.httpService.post<SignedProductImagesResponse>(
            this.buildUrl(
              service.url,
              '/api/storage/products/images/signed-urls',
            ),
            {
              imageKeys: batch,
            },
            {
              timeout: service.timeoutMs,
              headers: {
                Authorization: authorization,
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            },
          ),
        );

        const images = response.data?.images;

        if (!Array.isArray(images)) {
          throw new Error('Auth returned an invalid signed image response.');
        }

        for (const image of images) {
          if (
            typeof image.imageKey === 'string' &&
            typeof image.imageUrl === 'string'
          ) {
            imageUrls.set(image.imageKey, image.imageUrl);
          }
        }
      } catch {
        throw new ServiceUnavailableException({
          code: 'SERVICE_UNAVAILABLE',
        });
      }
    }

    return imageUrls;
  }

  private getAuthServiceConfig(): ServiceConfig {
    const service = this.configService.get<ServiceConfig>('services.auth', {
      infer: true,
    });

    if (!service) {
      throw new Error('Auth service configuration not found.');
    }

    return service;
  }

  private buildUrl(baseUrl: string, path: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private isRecord(value: unknown): value is ProductRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
