import { of, throwError } from 'rxjs';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';

import type { AuthenticatedRequest } from '@petoman/security';
import { ProductImageUrlEnricherService } from './product-image-url-enricher.service';

import { GatewayAuthMode, GatewayTarget } from '../routing/gateway-route.types';
import { GatewayDownstreamAuthService } from '../../../common/authentication/gateway-downstream-auth.service';
import { ProxyHeaderService } from './proxy-header.service';
import { DownstreamHttpException } from '../../../common/exceptions/downstream-http.exception';
import { ProductOrchestrationService } from './product-orchestration.service';

describe('ProductOrchestrationService', () => {
  let service: ProductOrchestrationService;

  const authConfig = {
    url: 'http://auth.internal',
    timeoutMs: 5000,
  };

  const marketConfig = {
    url: 'http://market.internal',
    timeoutMs: 5000,
  };

  const httpService = {
    request: jest.fn(),
  } as unknown as jest.Mocked<HttpService>;

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'services.auth') return authConfig;
      if (key === 'services.market') return marketConfig;
      return undefined;
    }),
  } as unknown as jest.Mocked<ConfigService>;

  const gatewayDownstreamAuthService = {
    createAuthorizationHeader: jest.fn(),
    createTenantServiceAuthorizationHeader: jest.fn(
      (target: GatewayTarget, tenantId: string) =>
        `Bearer ${target}-internal-token`,
    ),
  } as unknown as jest.Mocked<GatewayDownstreamAuthService>;

  const proxyHeaderService = {
    getForwardHeaders: jest.fn(),
  } as unknown as jest.Mocked<ProxyHeaderService>;

  const productImageUrlEnricherService = {
    enrich: jest.fn(),
  };

  const tenantResolverService = {
    resolveBySlug: jest.fn(),
  };

  const request = {
    method: 'POST',
    path: '/api/products',
    headers: {
      'content-type': 'multipart/form-data; boundary=client-boundary',
      'content-length': '1234',
    },
    body: {
      name: 'Test product',
      price: 150000,
      image_key: 'client-controlled-key',
    },
    user: {
      sub: 'user-001',
      sid: 'session-001',
      tenantId: 'tenant-001',
      roles: ['OWNER'],
      permissions: ['product.create', 'product.update'],
    },
  } as unknown as AuthenticatedRequest;

  const imageFile = {
    buffer: Buffer.from('test-image-content'),
    size: 19,
    mimetype: 'image/png',
    originalname: 'product.png',
  };

  const uploadedImageKey =
    'tenants/tenant-001/products/11111111-1111-4111-8111-111111111111.webp';

  const previousImageKey =
    'tenants/tenant-001/products/22222222-2222-4222-8222-222222222222.webp';

  const marketResponse = {
    success: true,
    data: {
      product: {
        id: 10,
        name: 'Test product',
      },
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    tenantResolverService.resolveBySlug.mockResolvedValue({
      tenantId: 'tenant-001',
      status: 'ACTIVE',
    });

    productImageUrlEnricherService.enrich.mockImplementation(
      async <T>(response: T): Promise<T> => response,
    );

    configService.get.mockImplementation((key: string) => {
      if (key === 'services.auth') return authConfig;
      if (key === 'services.market') return marketConfig;
      return undefined;
    });

    gatewayDownstreamAuthService.createAuthorizationHeader.mockImplementation(
      (target: GatewayTarget) => `Bearer ${target}-internal-token`,
    );

    gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader.mockImplementation(
      (target: GatewayTarget, tenantId: string) =>
        `Bearer ${target}-internal-token`,
    );

    proxyHeaderService.getForwardHeaders.mockImplementation(
      (_request, authorization) => ({
        authorization,
        'x-request-id': 'request-001',
        'content-type': 'multipart/form-data; boundary=client-boundary',
        'content-length': '1234',
      }),
    );
  });

  function createService(): void {
    service = new ProductOrchestrationService(
      httpService,
      configService,
      gatewayDownstreamAuthService,
      proxyHeaderService,
      productImageUrlEnricherService as unknown as ProductImageUrlEnricherService,
      tenantResolverService as never,
    );
  }

  it('should retrieve and enrich the product list', async () => {
    httpService.request.mockReturnValue(
      of({
        data: marketResponse,
        status: 200,
      }) as never,
    );

    createService();

    const result = await service.findAll({
      request: {
        ...request,
        method: 'GET',
        query: {
          page: '2',
          per_page: '10',
        },
      } as never,
      params: {},
    });

    const options = httpService.request.mock.calls[0][0];

    expect(options.method).toBe('GET');
    expect(options.url).toBe('http://market.internal/api/products');
    expect(options.params).toEqual({
      page: '2',
      per_page: '10',
    });

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).toHaveBeenCalledWith(
      GatewayTarget.MARKET,
      GatewayAuthMode.JWT,
      expect.anything(),
    );

    expect(productImageUrlEnricherService.enrich).toHaveBeenCalledWith(
      marketResponse,
      'Bearer AUTH-internal-token',
    );

    expect(result).toEqual({
      type: 'json',
      data: marketResponse,
      status: 200,
    });
  });

  it('should retrieve and enrich a product by ID', async () => {
    httpService.request.mockReturnValue(
      of({
        data: marketResponse,
        status: 200,
      }) as never,
    );

    createService();

    const result = await service.findById({
      request: {
        ...request,
        method: 'GET',
      } as never,
      params: {
        productId: '10018',
      },
    });

    const options = httpService.request.mock.calls[0][0];

    expect(options.method).toBe('GET');
    expect(options.url).toBe('http://market.internal/api/products/10018');

    expect(productImageUrlEnricherService.enrich).toHaveBeenCalledWith(
      marketResponse,
      'Bearer AUTH-internal-token',
    );

    expect(result.status).toBe(200);
  });

  it('should reject product details request without a product ID', async () => {
    createService();

    await expect(
      service.findById({
        request: request as never,
        params: {},
      }),
    ).rejects.toThrow('A valid product ID is required.');

    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('should retrieve and enrich public store products using store tenant authorization', async () => {
    httpService.request.mockReturnValue(
      of({
        data: marketResponse,
        status: 200,
      }) as never,
    );

    createService();

    const result = await service.findPublicByStoreSlug({
      request: {
        ...request,
        method: 'GET',
        query: {
          page: '1',
        },
      } as never,
      params: {
        storeSlug: 'test-store',
      },
    });

    expect(tenantResolverService.resolveBySlug).toHaveBeenCalledWith(
      'test-store',
    );

    expect(
      gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader,
    ).toHaveBeenNthCalledWith(1, GatewayTarget.MARKET, 'tenant-001');

    expect(
      gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader,
    ).toHaveBeenNthCalledWith(2, GatewayTarget.AUTH, 'tenant-001');

    const options = httpService.request.mock.calls[0][0];

    expect(options.method).toBe('GET');
    expect(options.url).toBe(
      'http://market.internal/api/public/stores/test-store/products',
    );
    expect(options.params).toEqual({
      page: '1',
    });

    expect(productImageUrlEnricherService.enrich).toHaveBeenCalledWith(
      marketResponse,
      'Bearer AUTH-internal-token',
    );

    expect(result.status).toBe(200);
  });

  it('should reject public products request for an inactive store', async () => {
    tenantResolverService.resolveBySlug.mockResolvedValue({
      tenantId: 'tenant-001',
      status: 'SUSPENDED',
    });

    createService();

    await expect(
      service.findPublicByStoreSlug({
        request: request as never,
        params: {
          storeSlug: 'inactive-store',
        },
      }),
    ).rejects.toMatchObject({
      status: 404,
    });

    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('should create a product without uploading an image', async () => {
    httpService.request.mockReturnValue(
      of({
        data: marketResponse,
        status: 201,
      }) as never,
    );

    createService();

    const result = await service.create({
      request: request as never,
      params: {},
    });

    expect(httpService.request).toHaveBeenCalledTimes(1);

    const options = httpService.request.mock.calls[0][0];

    expect(options.method).toBe('POST');
    expect(options.url).toBe('http://market.internal/api/products');
    expect(options.data).toEqual({
      name: 'Test product',
      price: 150000,
    });

    expect(result).toEqual({
      type: 'json',
      data: marketResponse,
      status: 201,
    });
  });

  it('should upload an image and use the generated image key when creating a product', async () => {
    httpService.request
      .mockReturnValueOnce(
        of({
          data: { imageKey: uploadedImageKey },
          status: 201,
        }) as never,
      )
      .mockReturnValueOnce(
        of({
          data: marketResponse,
          status: 201,
        }) as never,
      );

    createService();

    const result = await service.create({
      request: {
        ...request,
        file: imageFile,
      } as never,
      params: {},
    });

    expect(httpService.request).toHaveBeenCalledTimes(2);

    const uploadOptions = httpService.request.mock.calls[0][0];
    const marketOptions = httpService.request.mock.calls[1][0];

    expect(uploadOptions.method).toBe('POST');
    expect(uploadOptions.url).toBe(
      'http://auth.internal/api/storage/products/images',
    );
    expect(uploadOptions.data).toBeInstanceOf(FormData);
    expect(uploadOptions.headers).not.toHaveProperty('content-type');
    expect(uploadOptions.headers).not.toHaveProperty('content-length');

    expect(marketOptions.method).toBe('POST');
    expect(marketOptions.data).toEqual({
      name: 'Test product',
      price: 150000,
      image_key: uploadedImageKey,
    });
    expect(marketOptions.headers?.['content-type']).toBe('application/json');

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).toHaveBeenNthCalledWith(
      1,
      GatewayTarget.AUTH,
      GatewayAuthMode.JWT,
      expect.anything(),
    );

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).toHaveBeenNthCalledWith(
      2,
      GatewayTarget.MARKET,
      GatewayAuthMode.JWT,
      expect.anything(),
    );

    expect(result.status).toBe(201);
  });

  it('should clean up the uploaded image when product creation fails', async () => {
    httpService.request
      .mockReturnValueOnce(
        of({
          data: { imageKey: uploadedImageKey },
          status: 201,
        }) as never,
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            ({
              response: {
                status: 422,
                data: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid product data',
                },
              },
            }) as never,
        ),
      )
      .mockReturnValueOnce(
        of({
          data: { deleted: true },
          status: 200,
        }) as never,
      );

    createService();

    await expect(
      service.create({
        request: {
          ...request,
          file: imageFile,
        } as never,
        params: {},
      }),
    ).rejects.toBeInstanceOf(DownstreamHttpException);

    expect(httpService.request).toHaveBeenCalledTimes(3);

    const cleanupOptions = httpService.request.mock.calls[2][0];

    expect(cleanupOptions.method).toBe('DELETE');
    expect(cleanupOptions.url).toBe(
      'http://auth.internal/api/storage/products/images',
    );
    expect(cleanupOptions.data).toEqual({
      imageKey: uploadedImageKey,
    });
  });

  it('should delete the previous image only after a successful product update', async () => {
    const updateResponse = {
      success: true,
      data: {
        product: {
          id: 10,
          name: 'Updated product',
        },
        previous_image_key: previousImageKey,
      },
    };

    httpService.request
      .mockReturnValueOnce(
        of({
          data: { imageKey: uploadedImageKey },
          status: 201,
        }) as never,
      )
      .mockReturnValueOnce(
        of({
          data: updateResponse,
          status: 200,
        }) as never,
      )
      .mockReturnValueOnce(
        of({
          data: { deleted: true },
          status: 200,
        }) as never,
      );

    createService();

    const result = await service.update({
      request: {
        ...request,
        method: 'PUT',
        file: imageFile,
      } as never,
      params: {
        productId: '10',
      },
    });

    expect(httpService.request).toHaveBeenCalledTimes(3);

    const updateOptions = httpService.request.mock.calls[1][0];
    const cleanupOptions = httpService.request.mock.calls[2][0];

    expect(updateOptions.method).toBe('PUT');
    expect(updateOptions.url).toBe('http://market.internal/api/products/10');
    expect(updateOptions.data.image_key).toBe(uploadedImageKey);

    expect(cleanupOptions.method).toBe('DELETE');
    expect(cleanupOptions.data).toEqual({
      imageKey: previousImageKey,
    });

    expect(result).toEqual({
      type: 'json',
      data: {
        success: true,
        data: {
          product: {
            id: 10,
            name: 'Updated product',
          },
        },
      },
      status: 200,
    });
  });

  it('should clean up the new image but preserve the previous image when update fails', async () => {
    httpService.request
      .mockReturnValueOnce(
        of({
          data: { imageKey: uploadedImageKey },
          status: 201,
        }) as never,
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            ({
              response: {
                status: 422,
                data: {
                  code: 'VALIDATION_ERROR',
                  message: 'Update failed',
                },
              },
            }) as never,
        ),
      )
      .mockReturnValueOnce(
        of({
          data: { deleted: true },
          status: 200,
        }) as never,
      );

    createService();

    await expect(
      service.update({
        request: {
          ...request,
          method: 'PUT',
          file: imageFile,
        } as never,
        params: {
          productId: '10',
        },
      }),
    ).rejects.toBeInstanceOf(DownstreamHttpException);

    expect(httpService.request).toHaveBeenCalledTimes(3);

    const cleanupOptions = httpService.request.mock.calls[2][0];

    expect(cleanupOptions.method).toBe('DELETE');
    expect(cleanupOptions.data).toEqual({
      imageKey: uploadedImageKey,
    });

    expect(cleanupOptions.data.imageKey).not.toBe(previousImageKey);
  });

  it('should not delete the existing image when updating without a new image', async () => {
    httpService.request.mockReturnValue(
      of({
        data: {
          success: true,
          data: {
            product: {
              id: 10,
            },
            previous_image_key: previousImageKey,
          },
        },
        status: 200,
      }) as never,
    );

    createService();

    await service.update({
      request: {
        ...request,
        method: 'PUT',
      } as never,
      params: {
        productId: '10',
      },
    });

    expect(httpService.request).toHaveBeenCalledTimes(1);
    expect(httpService.request.mock.calls[0][0].method).toBe('PUT');
  });

  it('should reject an update without a product ID', async () => {
    createService();

    await expect(
      service.update({
        request: request as never,
        params: {},
      }),
    ).rejects.toThrow('A valid product ID is required.');

    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('should map downstream timeout errors to GatewayTimeoutException', async () => {
    httpService.request.mockReturnValue(
      throwError(
        () =>
          ({
            code: 'ECONNABORTED',
          }) as never,
      ),
    );

    createService();

    await expect(
      service.create({
        request: request as never,
        params: {},
      }),
    ).rejects.toMatchObject({
      status: 504,
    });
  });
});
