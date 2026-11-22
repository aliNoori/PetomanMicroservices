import { ConfigService } from '@nestjs/config';

import { GatewayRouteRegistry } from './gateway-route.registry';

import {
  GatewayAuthMode,
  GatewayRouteType,
  GatewayTarget,
  GatewayTenantResolution,
} from '../gateway-route.types';

describe('GatewayRouteRegistry', () => {
  let registry: GatewayRouteRegistry;
  let configService: {
    get: jest.Mock;
  };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const configs: Record<
          string,
          {
            prefix: string;
            url: string;
            timeoutMs: number;
          }
        > = {
          'services.auth': {
            prefix: '/api/auth',
            url: 'http://localhost:3001',
            timeoutMs: 1000,
          },
          'services.market': {
            prefix: '/api/market',
            url: 'http://localhost:3004',
            timeoutMs: 1000,
          },
          'services.vet': {
            prefix: '/api/vet',
            url: 'http://localhost:3003',
            timeoutMs: 1000,
          },
          'services.pharmacy': {
            prefix: '/api/pharmacy',
            url: 'http://localhost:3005',
            timeoutMs: 1000,
          },
        };

        return configs[key];
      }),
    };

    registry = new GatewayRouteRegistry(
      configService as unknown as ConfigService,
    );
  });

  function isMarketPublicProductsRoute(
    route: ReturnType<GatewayRouteRegistry['getAll']>[number],
  ): route is Extract<
    ReturnType<GatewayRouteRegistry['getAll']>[number],
    { type: GatewayRouteType.PROXY }
  > {
    return (
      route.type === GatewayRouteType.PROXY &&
      route.target === GatewayTarget.MARKET &&
      route.downstreamPath === '/api/public/stores/:storeSlug/products'
    );
  }

  describe('constructor', () => {
    it('should register declared routes successfully', () => {
      expect(registry.getAll().length).toBeGreaterThan(0);
    });

    it('should resolve service configuration for proxy routes', () => {
      expect(configService.get).toHaveBeenCalledWith('services.market', {
        infer: true,
      });
    });
  });

  describe('find', () => {
    it('should find the public storefront products route', () => {
      const result = registry.find(
        'GET',
        '/api/market/public/stores/petoman-store/products',
      );

      expect(result).toBeDefined();

      expect(result?.params).toEqual({
        storeSlug: 'petoman-store',
      });

      expect(result?.route).toMatchObject({
        type: GatewayRouteType.PROXY,
        target: GatewayTarget.MARKET,
        auth: GatewayAuthMode.PUBLIC,
        tenantResolution: GatewayTenantResolution.STORE_SLUG,
        downstreamPath: '/api/public/stores/:storeSlug/products',
      });
    });

    it('should normalize repeated and trailing slashes', () => {
      const result = registry.find(
        'GET',
        '//api//market//public//stores//petoman-store//products//',
      );

      expect(result).toBeDefined();

      expect(result?.params).toEqual({
        storeSlug: 'petoman-store',
      });
    });

    it('should match HTTP methods case-insensitively', () => {
      const result = registry.find(
        'get',
        '/api/market/public/stores/petoman-store/products',
      );

      expect(result).toBeDefined();
    });

    it('should return undefined for an unknown route', () => {
      const result = registry.find(
        'GET',
        '/api/market/public/stores/unknown/products/extra',
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined for an unsupported HTTP method', () => {
      const result = registry.find(
        'DELETE',
        '/api/market/public/stores/petoman-store/products',
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return a copy of the registered routes array', () => {
      const first = registry.getAll();
      const second = registry.getAll();

      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });

    it('should return routes with resolved service prefixes', () => {
      const marketRoute = registry.getAll().find(isMarketPublicProductsRoute);

      expect(marketRoute).toBeDefined();
      expect(marketRoute?.path).toBe(
        '/api/market/public/stores/:storeSlug/products',
      );
    });

    it('should not modify the declared downstream path', () => {
      const marketRoute = registry.getAll().find(isMarketPublicProductsRoute);

      expect(marketRoute?.downstreamPath).toBe(
        '/api/public/stores/:storeSlug/products',
      );
    });
  });
});
