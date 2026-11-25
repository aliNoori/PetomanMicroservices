import {
  BadRequestException,
  GatewayTimeoutException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { GatewayDownstreamAuthService } from '../../../common/authentication/gateway-downstream-auth.service';
import { ProductImageUrlEnricherService } from './product-image-url-enricher.service';

import { InternalJwtService } from '@petoman/security';

import { SERVICE_NAMES } from '../constants/service-route.constants';

import { AggregationContext, AggregationService } from './aggregation.service';

import { TenantResolverService } from './tenant-resolver.service';
import { ConfigurationService } from '../../../config/configuration.service';
import { ApiResponsePayload } from '../../../common/types/api-response-payload.type';
import { GatewayAuthMode, GatewayTarget } from '../routing/gateway-route.types';

describe('AggregationService', () => {
  const marketConfig = {
    prefix: '/api/market',
    url: 'http://localhost:3004',
    timeoutMs: 5000,
  };

  const authConfig = {
    prefix: '/api/auth',
    url: 'http://localhost:3001',
    timeoutMs: 5000,
  };

  const internalJwtConfig = {
    secret: 'test-internal-secret',
    issuer: 'petoman-gateway',
    marketAudience: 'petoman-market',
    expiresInSeconds: 60,
  };

  const tenant = {
    tenantId: 'tenant-001',
    status: 'ACTIVE',
  };

  const productsPayload = {
    tenant_id: 'tenant-001',
    products: [
      {
        id: 'product-001',
        name: 'Test Product',
      },
    ],
  };

  let service: AggregationService;

  let httpService: {
    get: jest.Mock;
    post: jest.Mock;
  };

  let configService: {
    get: jest.Mock;
  };

  let tenantResolverService: {
    resolveBySlug: jest.Mock;
    resolveActiveTenants: jest.Mock;
  };

  let internalJwtService: {
    signTenantToken: jest.Mock;
    signServiceToken: jest.Mock;
  };

  let configurationService: {
    internalJwt: typeof internalJwtConfig;
  };

  let gatewayDownstreamAuthService: {
    createTenantServiceAuthorizationHeader: jest.Mock;
    createAuthorizationHeader: jest.Mock;
  };

  let productImageUrlEnricherService: {
    enrich: jest.Mock;
  };

  const createContext = (query: Record<string, unknown>): AggregationContext =>
    ({
      request: {} as AggregationContext['request'],
      params: {},
      query,
    }) as AggregationContext;

  const createAxiosError = (options: { status?: number; code?: string }) => ({
    isAxiosError: true,
    response:
      options.status !== undefined ? { status: options.status } : undefined,
    code: options.code,
  });

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === `services.${SERVICE_NAMES.AUTH}`) {
          return authConfig;
        }

        if (key === `services.${SERVICE_NAMES.MARKET}`) {
          return marketConfig;
        }

        return undefined;
      }),
    };

    tenantResolverService = {
      resolveBySlug: jest.fn().mockResolvedValue(tenant),
      resolveActiveTenants: jest.fn().mockResolvedValue([]),
    };

    internalJwtService = {
      signTenantToken: jest.fn().mockReturnValue('internal-market-token'),
      signServiceToken: jest.fn().mockReturnValue('global-market-token'),
    };

    configurationService = {
      internalJwt: internalJwtConfig,
    };

    gatewayDownstreamAuthService = {
      createTenantServiceAuthorizationHeader: jest
        .fn()
        .mockReturnValue('Bearer auth-tenant-token'),

      createAuthorizationHeader: jest
        .fn()
        .mockReturnValue('Bearer auth-global-token'),
    };

    productImageUrlEnricherService = {
      enrich: jest
        .fn()
        .mockImplementation(async <T>(response: T): Promise<T> => response),
    };

    service = new AggregationService(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
      tenantResolverService as unknown as TenantResolverService,
      internalJwtService as unknown as InternalJwtService,
      configurationService as unknown as ConfigurationService,
      gatewayDownstreamAuthService as unknown as GatewayDownstreamAuthService,
      productImageUrlEnricherService as unknown as ProductImageUrlEnricherService,
    );
  });

  describe('MARKET_PRODUCTS', () => {
    it('should reject an empty store slug', async () => {
      const context = createContext({
        storeSlug: '   ',
      });

      await expect(
        service.execute('MARKET_PRODUCTS', context),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(tenantResolverService.resolveBySlug).not.toHaveBeenCalled();
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch products using a tenant-scoped internal JWT', async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            data: productsPayload,
          },
        }),
      );

      const context = createContext({
        storeSlug: ' test-store ',
      });

      const result = await service.execute('MARKET_PRODUCTS', context);

      expect(tenantResolverService.resolveBySlug).toHaveBeenCalledWith(
        'test-store',
      );

      expect(internalJwtService.signTenantToken).toHaveBeenCalledWith(
        tenant.tenantId,
        {
          secret: internalJwtConfig.secret,
          issuer: internalJwtConfig.issuer,
          audience: internalJwtConfig.marketAudience,
          expiresInSeconds: internalJwtConfig.expiresInSeconds,
        },
      );

      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3004/api/public/products',
        {
          timeout: marketConfig.timeoutMs,
          headers: {
            Authorization: 'Bearer internal-market-token',
            Accept: 'application/json',
          },
        },
      );

      expect(result).toEqual(productsPayload);

      expect(
        gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader,
      ).toHaveBeenCalledWith(GatewayTarget.AUTH, tenant.tenantId);

      expect(productImageUrlEnricherService.enrich).toHaveBeenCalledWith(
        {
          data: productsPayload,
        },
        'Bearer auth-tenant-token',
      );
    });

    it('should reject a tenant that is not active', async () => {
      tenantResolverService.resolveBySlug.mockResolvedValue({
        tenantId: 'tenant-001',
        status: 'SUSPENDED',
      });

      const context = createContext({
        storeSlug: 'test-store',
      });

      await expect(
        service.execute('MARKET_PRODUCTS', context),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(internalJwtService.signTenantToken).not.toHaveBeenCalled();
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should translate a non-Axios downstream error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        httpService.get.mockReturnValue(
          throwError(() => 'Unexpected downstream failure'),
        );

        const context = createContext({
          storeSlug: 'test-store',
        });

        await expect(
          service.execute('MARKET_PRODUCTS', context),
        ).rejects.toBeInstanceOf(InternalServerErrorException);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('should translate an unauthorized downstream response', async () => {
      httpService.get.mockReturnValue(
        throwError(() => createAxiosError({ status: 401 })),
      );

      const context = createContext({
        storeSlug: 'test-store',
      });

      await expect(
        service.execute('MARKET_PRODUCTS', context),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should translate a downstream not found response', async () => {
      httpService.get.mockReturnValue(
        throwError(() => createAxiosError({ status: 404 })),
      );

      const context = createContext({
        storeSlug: 'test-store',
      });

      await expect(
        service.execute('MARKET_PRODUCTS', context),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should translate a downstream timeout', async () => {
      httpService.get.mockReturnValue(
        throwError(() => createAxiosError({ code: 'ECONNABORTED' })),
      );

      const context = createContext({
        storeSlug: 'test-store',
      });

      await expect(
        service.execute('MARKET_PRODUCTS', context),
      ).rejects.toBeInstanceOf(GatewayTimeoutException);
    });

    it('should translate a downstream connection failure', async () => {
      httpService.get.mockReturnValue(
        throwError(() => createAxiosError({ code: 'ECONNREFUSED' })),
      );

      const context = createContext({
        storeSlug: 'test-store',
      });

      await expect(
        service.execute('MARKET_PRODUCTS', context),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('MARKET_HOME_PRODUCTS', () => {
    const activeTenants = [
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

    const homeProductsPayload = {
      data: {
        products: [
          {
            id: 'product-001',
            tenant_id: 'tenant-001',
            name: 'Product One',
            stock: 5,
          },
        ],
      },
      meta: {
        pagination: {
          per_page: 20,
          has_more: false,
          next_cursor: null,
          previous_cursor: null,
        },
      },
    };

    it('should fetch home products from all active tenants in one request', async () => {
      tenantResolverService.resolveActiveTenants.mockResolvedValue(
        activeTenants,
      );

      httpService.post.mockReturnValue(
        of({
          data: {
            success: true,
            data: homeProductsPayload.data,
            meta: homeProductsPayload.meta,
          },
        }),
      );

      const result = await service.execute(
        'MARKET_HOME_PRODUCTS',
        createContext({
          perPage: '20',
          cursor: 'cursor-001',
        }),
      );

      expect(tenantResolverService.resolveActiveTenants).toHaveBeenCalledTimes(
        1,
      );

      expect(internalJwtService.signServiceToken).toHaveBeenCalledWith({
        secret: internalJwtConfig.secret,
        issuer: internalJwtConfig.issuer,
        audience: internalJwtConfig.marketAudience,
        expiresInSeconds: internalJwtConfig.expiresInSeconds,
      });

      expect(httpService.post).toHaveBeenCalledTimes(1);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:3004/api/internal/public/home-products',
        {
          tenant_ids: ['tenant-001', 'tenant-002'],
          per_page: '20',
          cursor: 'cursor-001',
        },
        {
          timeout: marketConfig.timeoutMs,
          headers: {
            Authorization: 'Bearer global-market-token',
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      expect(
        gatewayDownstreamAuthService.createAuthorizationHeader,
      ).toHaveBeenCalledWith(
        GatewayTarget.AUTH,
        GatewayAuthMode.PUBLIC,
        expect.any(Object),
      );

      expect(productImageUrlEnricherService.enrich).toHaveBeenCalledWith(
        {
          data: homeProductsPayload.data,
        },
        'Bearer auth-global-token',
      );

      expect(result).toEqual(
        new ApiResponsePayload(
          {
            tenants: activeTenants,
            ...homeProductsPayload.data,
          },
          {
            pagination: homeProductsPayload.meta.pagination,
          },
        ),
      );
    });

    it('should return empty products without calling Market when no active tenants exist', async () => {
      tenantResolverService.resolveActiveTenants.mockResolvedValue([]);

      const result = await service.execute(
        'MARKET_HOME_PRODUCTS',
        createContext({}),
      );

      expect(result).toEqual(
        new ApiResponsePayload(
          {
            tenants: [],
            products: [],
          },
          {
            pagination: null,
          },
        ),
      );

      expect(internalJwtService.signServiceToken).not.toHaveBeenCalled();
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should translate Market timeout errors', async () => {
      tenantResolverService.resolveActiveTenants.mockResolvedValue(
        activeTenants,
      );

      httpService.post.mockReturnValue(
        throwError(() => createAxiosError({ code: 'ECONNABORTED' })),
      );

      await expect(
        service.execute('MARKET_HOME_PRODUCTS', createContext({})),
      ).rejects.toBeInstanceOf(GatewayTimeoutException);
    });

    it('should translate Auth service failures', async () => {
      tenantResolverService.resolveActiveTenants.mockRejectedValue(
        new ServiceUnavailableException('Auth service is unavailable.'),
      );

      await expect(
        service.execute('MARKET_HOME_PRODUCTS', createContext({})),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);

      expect(httpService.post).not.toHaveBeenCalled();
    });
  });

  describe('ME', () => {
    const createMeContext = (
      authorization?: string,
      userId?: string,
    ): AggregationContext =>
      ({
        request: {
          headers: {
            authorization,
          },
          user: userId
            ? {
                sub: userId,
              }
            : undefined,
        },
        params: {},
        query: {},
      }) as AggregationContext;

    it('should reject a request without authorization header', async () => {
      await expect(
        service.execute('ME', createMeContext()),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should reject a request without authenticated user ID', async () => {
      await expect(
        service.execute('ME', createMeContext('Bearer user-token')),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should aggregate user information and orders', async () => {
      const user = {
        id: 'user-001',
        email: 'user@example.com',
      };

      const orders = [
        {
          id: 'order-001',
          total: 100,
        },
      ];

      httpService.get
        .mockReturnValueOnce(
          of({
            data: {
              data: user,
            },
          }),
        )
        .mockReturnValueOnce(
          of({
            data: {
              data: {
                orders,
              },
            },
          }),
        );

      const result = await service.execute(
        'ME',
        createMeContext('Bearer user-token', 'user-001'),
      );

      expect(httpService.get).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3001/api/auth/users/user-001',
        {
          timeout: authConfig.timeoutMs,
          headers: {
            Authorization: 'Bearer user-token',
          },
        },
      );

      expect(httpService.get).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3004/api/orders',
        {
          timeout: marketConfig.timeoutMs,
          headers: {
            Authorization: 'Bearer user-token',
          },
        },
      );

      expect(result).toEqual({
        ...user,
        orders,
      });
    });

    it('should translate an unexpected downstream error', async () => {
      httpService.get
        .mockReturnValueOnce(
          throwError(() => new Error('Unexpected downstream error')),
        )
        .mockReturnValueOnce(
          of({
            data: {
              data: {
                orders: [],
              },
            },
          }),
        );

      await expect(
        service.execute('ME', createMeContext('Bearer user-token', 'user-001')),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw when Auth service configuration is missing', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(
        service.execute('ME', createMeContext('Bearer user-token', 'user-001')),
      ).rejects.toThrow('Service configuration not found: auth');

      expect(httpService.get).not.toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    it('should reject an unknown aggregation handler', async () => {
      await expect(
        service.execute('UNKNOWN_HANDLER', createContext({})),
      ).rejects.toThrow('Unknown aggregation handler: UNKNOWN_HANDLER');
    });

    it('should execute the dashboard handler', async () => {
      await expect(
        service.execute('DASHBOARD', createContext({})),
      ).resolves.toEqual({
        message: 'Dashboard aggregation',
      });
    });
  });
});
