
import { of, throwError } from 'rxjs';
import { ServiceUnavailableException } from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';

import { ProductImageUrlEnricherService } from './product-image-url-enricher.service';

describe('ProductImageUrlEnricherService', () => {
  let service: ProductImageUrlEnricherService;

  const authConfig = {
    url: 'http://auth.internal/',
    timeoutMs: 5000,
  };

  const httpService = {
    post: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const authorization = 'Bearer auth-internal-token';

  beforeEach(() => {
    jest.resetAllMocks();

    configService.get.mockReturnValue(authConfig);

    service = new ProductImageUrlEnricherService(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  });

  it('should enrich product images and remove image_key', async () => {
    const response = {
      success: true,
      data: {
        products: [
          {
            id: 1,
            name: 'Product 1',
            image_key: 'tenants/tenant-001/products/image-1.webp',
          },
        ],
      },
    };

    httpService.post.mockReturnValue(
      of({
        data: {
          images: [
            {
              imageKey: 'tenants/tenant-001/products/image-1.webp',
              imageUrl: 'https://storage.example.com/image-1.webp',
            },
          ],
        },
      }),
    );

    const result = await service.enrich(response, authorization);

    expect(result).toEqual({
      success: true,
      data: {
        products: [
          {
            id: 1,
            name: 'Product 1',
            image_url: 'https://storage.example.com/image-1.webp',
          },
        ],
      },
    });

    expect(result.data.products[0]).not.toHaveProperty('image_key');

    expect(httpService.post).toHaveBeenCalledWith(
      'http://auth.internal/api/storage/products/images/signed-urls',
      {
        imageKeys: [
          'tenants/tenant-001/products/image-1.webp',
        ],
      },
      {
        timeout: 5000,
        headers: {
          Authorization: authorization,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('should enrich a single product response', async () => {
    const response = {
      success: true,
      data: {
        product: {
          id: 10,
          name: 'Single product',
          image_key: 'tenants/tenant-001/products/single.webp',
        },
      },
    };

    httpService.post.mockReturnValue(
      of({
        data: {
          images: [
            {
              imageKey: 'tenants/tenant-001/products/single.webp',
              imageUrl: 'https://storage.example.com/single.webp',
            },
          ],
        },
      }),
    );

    const result = await service.enrich(response, authorization);

    expect(result.data.product).toEqual({
      id: 10,
      name: 'Single product',
      image_url: 'https://storage.example.com/single.webp',
    });

    expect(result.data.product).not.toHaveProperty('image_key');
  });

  it('should deduplicate image keys across products', async () => {
    const imageKey = 'tenants/tenant-001/products/shared.webp';

    const response = {
      data: {
        products: [
          { id: 1, image_key: imageKey },
          { id: 2, image_key: imageKey },
          { id: 3, name: 'Without image' },
        ],
      },
    };

    httpService.post.mockReturnValue(
      of({
        data: {
          images: [
            {
              imageKey,
              imageUrl: 'https://storage.example.com/shared.webp',
            },
          ],
        },
      }),
    );

    const result = await service.enrich(response, authorization);

    expect(httpService.post).toHaveBeenCalledTimes(1);

    expect(httpService.post.mock.calls[0][1]).toEqual({
      imageKeys: [imageKey],
    });

    expect(result.data.products).toEqual([
      {
        id: 1,
        image_url: 'https://storage.example.com/shared.webp',
      },
      {
        id: 2,
        image_url: 'https://storage.example.com/shared.webp',
      },
      {
        id: 3,
        name: 'Without image',
        image_url: null,
      },
    ]);
  });

  it('should return null image_url when a product has no image', async () => {
    const response = {
      data: {
        products: [
          { id: 1, name: 'Product without image' },
          { id: 2, name: 'Product with empty image', image_key: '' },
        ],
      },
    };

    const result = await service.enrich(response, authorization);

    expect(httpService.post).not.toHaveBeenCalled();

    expect(result.data.products).toEqual([
      {
        id: 1,
        name: 'Product without image',
        image_url: null,
      },
      {
        id: 2,
        name: 'Product with empty image',
        image_url: null,
      },
    ]);
  });

  it('should split image keys into batches of at most 100', async () => {
    const products = Array.from({ length: 205 }, (_, index) => ({
      id: index + 1,
      image_key: `tenants/tenant-001/products/${index + 1}.webp`,
    }));

    httpService.post.mockImplementation(
      (_url: string, body: { imageKeys: string[] }) =>
        of({
          data: {
            images: body.imageKeys.map((imageKey) => ({
              imageKey,
              imageUrl: `https://storage.example.com/${imageKey.split('/').pop()}`,
            })),
          },
        }),
    );

    const result = await service.enrich(
      { data: { products } },
      authorization,
    );

    expect(httpService.post).toHaveBeenCalledTimes(3);

    expect(httpService.post.mock.calls[0][1].imageKeys).toHaveLength(100);
    expect(httpService.post.mock.calls[1][1].imageKeys).toHaveLength(100);
    expect(httpService.post.mock.calls[2][1].imageKeys).toHaveLength(5);

    expect(result.data.products).toHaveLength(205);

    expect(result.data.products[204].image_url).toBe(
      'https://storage.example.com/205.webp',
    );
  });

  it('should throw ServiceUnavailableException when Auth signing fails', async () => {
    httpService.post.mockReturnValue(
      throwError(() => new Error('Auth service unavailable')),
    );

    const response = {
      data: {
        products: [
          {
            id: 1,
            image_key: 'tenants/tenant-001/products/image.webp',
          },
        ],
      },
    };

    await expect(
      service.enrich(response, authorization),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should throw ServiceUnavailableException when Auth returns an invalid response', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          invalid: true,
        },
      }),
    );

    const response = {
      data: {
        products: [
          {
            id: 1,
            image_key: 'tenants/tenant-001/products/image.webp',
          },
        ],
      },
    };

    await expect(
      service.enrich(response, authorization),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should leave unrelated response structures unchanged', async () => {
    const response = {
      success: true,
      data: {
        categories: [],
        pagination: {
          total: 0,
        },
      },
    };

    const result = await service.enrich(response, authorization);

    expect(result).toBe(response);
    expect(httpService.post).not.toHaveBeenCalled();
  });
});
