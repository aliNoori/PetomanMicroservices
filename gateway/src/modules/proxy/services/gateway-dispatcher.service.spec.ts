import { ForbiddenException } from '@nestjs/common';

import { GatewayOrchestrationService } from './gateway-orchestration.service';

import type { AuthenticatedRequest } from '@petoman/security';

import {
  GatewayAuthMode,
  GatewayRouteType,
  GatewayTarget,
  GatewayTenantContext,
  GatewayTenantResolution,
  type GatewayProxyRoute,
} from '../routing/gateway-route.types';

import { TenantResolverService } from './tenant-resolver.service';

import { GatewayDispatcherService } from './gateway-dispatcher.service';
import { AggregationService } from './aggregation.service';
import { ProxyService } from './proxy.service';
import { ProxyHeaderService } from './proxy-header.service';
import { RouteResolverService } from './route-resolver.service';
import { GatewayAuthGuard } from '../../../common/guards/gateway-auth.guard';
import { GatewayAuthorizationService } from '../../../common/authorization/gateway-authorization.service';
import { GatewayDownstreamAuthService } from '../../../common/authentication/gateway-downstream-auth.service';
import { TenantContextValidatorService } from './tenant-context-validator.service';

describe('GatewayDispatcherService', () => {
  let service: GatewayDispatcherService;

  const routeResolver = {
    resolve: jest.fn(),
    getDownstreamPath: jest.fn(),
  } as unknown as jest.Mocked<RouteResolverService>;

  const tenantContextValidator = {
    validate: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<TenantContextValidatorService>;

  const tenantResolver = {
    resolveBySlug: jest.fn(),
  } as unknown as jest.Mocked<TenantResolverService>;

  const proxyService = {
    forward: jest.fn(),
  } as unknown as jest.Mocked<ProxyService>;

  const aggregationService = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<AggregationService>;

  const orchestrationService = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GatewayOrchestrationService>;

  const proxyHeaderService = {
    getForwardHeaders: jest.fn(),
  } as unknown as jest.Mocked<ProxyHeaderService>;

  const gatewayAuthGuard = {
    authenticate: jest.fn(),
  } as unknown as jest.Mocked<GatewayAuthGuard>;

  const gatewayAuthorizationService = {
    authorize: jest.fn(),
  } as unknown as jest.Mocked<GatewayAuthorizationService>;

  const gatewayDownstreamAuthService = {
    createAuthorizationHeader: jest.fn(),
    createTenantServiceAuthorizationHeader: jest.fn(),
  } as unknown as jest.Mocked<GatewayDownstreamAuthService>;

  const request = {
    method: 'GET',
    path: '/api/market/products',
    body: undefined,
    query: {},
    headers: {},
    is: jest.fn().mockReturnValue(false),
    user: {
      sub: 'user-001',
      sid: 'session-001',
      tenantId: 'tenant-001',
      roles: ['OWNER'],
      permissions: ['product.read'],
      email: 'user@example.com',
    },
  } as unknown as AuthenticatedRequest;

  const proxyRoute: GatewayProxyRoute = {
    type: GatewayRouteType.PROXY,
    method: 'GET',
    path: '/products',
    target: GatewayTarget.MARKET,
    downstreamPath: '/api/products',
    auth: GatewayAuthMode.JWT,
    permissions: ['product.read'],
  };

  beforeEach(() => {
    jest.resetAllMocks();

    tenantContextValidator.validate.mockResolvedValue(undefined);

    tenantResolver.resolveBySlug.mockResolvedValue({
      tenantId: 'tenant-001',
      status: 'ACTIVE',
    });

    gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader.mockReturnValue(
      'Bearer tenant-internal-jwt-token',
    );

    routeResolver.resolve.mockReturnValue({
      route: proxyRoute,
      params: {},
    });

    routeResolver.getDownstreamPath.mockReturnValue('/api/products');

    gatewayDownstreamAuthService.createAuthorizationHeader.mockReturnValue(
      'Bearer internal-jwt-token',
    );

    proxyHeaderService.getForwardHeaders.mockReturnValue({
      authorization: 'Bearer internal-jwt-token',
      'x-request-id': 'request-001',
    });

    proxyService.forward.mockResolvedValue({
      success: true,
      data: [],
    });

    service = new GatewayDispatcherService(
      routeResolver,
      tenantResolver,
      tenantContextValidator,
      proxyService,
      aggregationService,
      orchestrationService,
      proxyHeaderService,
      gatewayAuthGuard,
      gatewayAuthorizationService,
      gatewayDownstreamAuthService,
    );
  });

  it('should authenticate and authorize a JWT proxy request', async () => {
    await service.dispatch(request);

    expect(gatewayAuthGuard.authenticate).toHaveBeenCalledTimes(1);
    expect(gatewayAuthGuard.authenticate).toHaveBeenCalledWith(request);

    expect(gatewayAuthorizationService.authorize).toHaveBeenCalledTimes(1);

    expect(gatewayAuthorizationService.authorize).toHaveBeenCalledWith(
      request,
      proxyRoute,
    );
  });

  it('should create an internal authorization header for the downstream service', async () => {
    await service.dispatch(request);

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).toHaveBeenCalledTimes(1);

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).toHaveBeenCalledWith(GatewayTarget.MARKET, GatewayAuthMode.JWT, request);
  });

  it('should forward only the generated internal authorization header', async () => {
    await service.dispatch(request);

    expect(proxyHeaderService.getForwardHeaders).toHaveBeenCalledTimes(1);

    expect(proxyHeaderService.getForwardHeaders).toHaveBeenCalledWith(
      request,
      'Bearer internal-jwt-token',
    );
  });

  it('should forward the request to the downstream service', async () => {
    const result = await service.dispatch(request);

    expect(proxyService.forward).toHaveBeenCalledTimes(1);

    expect(proxyService.forward).toHaveBeenCalledWith(
      proxyRoute,
      'GET',
      '/api/products',
      {
        authorization: 'Bearer internal-jwt-token',
        'x-request-id': 'request-001',
      },
      request.body,
      request.query,
    );

    expect(result).toEqual({
      success: true,
      data: [],
    });
  });

  it('should not call downstream when authorization fails', async () => {
    gatewayAuthorizationService.authorize.mockImplementation(() => {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
      });
    });

    await expect(service.dispatch(request)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).not.toHaveBeenCalled();

    expect(proxyHeaderService.getForwardHeaders).not.toHaveBeenCalled();

    expect(proxyService.forward).not.toHaveBeenCalled();
  });

  it('should not call downstream when authentication fails', async () => {
    gatewayAuthGuard.authenticate.mockImplementation(() => {
      throw new Error('Invalid user token');
    });

    await expect(service.dispatch(request)).rejects.toThrow(
      'Invalid user token',
    );

    expect(gatewayAuthorizationService.authorize).not.toHaveBeenCalled();

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).not.toHaveBeenCalled();

    expect(proxyService.forward).not.toHaveBeenCalled();
  });

  it('should resolve the downstream path before forwarding', async () => {
    await service.dispatch(request);

    expect(routeResolver.getDownstreamPath).toHaveBeenCalledTimes(1);

    expect(routeResolver.getDownstreamPath).toHaveBeenCalledWith({
      route: proxyRoute,
      params: {},
    });
  });

  it('should reject a user without USER_READ permission', async () => {
    const usersRoute: GatewayProxyRoute = {
      ...proxyRoute,
      path: '/users/:userId',
      downstreamPath: '/api/auth/users/:userId',
      target: GatewayTarget.AUTH,
      permissions: ['user.read'],
    };

    const unauthorizedRequest = {
      ...request,
      path: '/api/auth/users/user-002',
      user: {
        ...request.user,
        permissions: ['product.read'],
      },
    } as unknown as AuthenticatedRequest;

    routeResolver.resolve.mockReturnValue({
      route: usersRoute,
      params: {
        userId: 'user-002',
      },
    });

    gatewayAuthorizationService.authorize.mockImplementation(() => {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
      });
    });

    await expect(service.dispatch(unauthorizedRequest)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(gatewayAuthGuard.authenticate).toHaveBeenCalledTimes(1);

    expect(gatewayAuthorizationService.authorize).toHaveBeenCalledTimes(1);

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).not.toHaveBeenCalled();

    expect(proxyHeaderService.getForwardHeaders).not.toHaveBeenCalled();

    expect(proxyService.forward).not.toHaveBeenCalled();
  });

  it('should validate the active tenant context before forwarding a REQUIRED route', async () => {
    const requiredTenantRoute: GatewayProxyRoute = {
      ...proxyRoute,
      tenantContext: GatewayTenantContext.REQUIRED,
    };

    routeResolver.resolve.mockReturnValue({
      route: requiredTenantRoute,
      params: {},
    });

    await service.dispatch(request);

    expect(tenantContextValidator.validate).toHaveBeenCalledTimes(1);

    expect(tenantContextValidator.validate).toHaveBeenCalledWith(
      'user-001',
      'tenant-001',
    );

    expect(proxyService.forward).toHaveBeenCalledTimes(1);
  });

  it('should reject a REQUIRED route when tenant context is missing', async () => {
    const requiredTenantRoute: GatewayProxyRoute = {
      ...proxyRoute,
      tenantContext: GatewayTenantContext.REQUIRED,
    };

    const requestWithoutTenant = {
      ...request,
      user: {
        ...request.user,
        tenantId: undefined,
      },
    } as unknown as AuthenticatedRequest;

    routeResolver.resolve.mockReturnValue({
      route: requiredTenantRoute,
      params: {},
    });

    await expect(service.dispatch(requestWithoutTenant)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(tenantContextValidator.validate).not.toHaveBeenCalled();
    expect(proxyService.forward).not.toHaveBeenCalled();
    expect(aggregationService.execute).not.toHaveBeenCalled();
  });

  it('should validate tenant context for an OPTIONAL route when tenant exists', async () => {
    const optionalTenantRoute: GatewayProxyRoute = {
      ...proxyRoute,
      tenantContext: GatewayTenantContext.OPTIONAL,
    };

    routeResolver.resolve.mockReturnValue({
      route: optionalTenantRoute,
      params: {},
    });

    await service.dispatch(request);

    expect(tenantContextValidator.validate).toHaveBeenCalledTimes(1);

    expect(tenantContextValidator.validate).toHaveBeenCalledWith(
      'user-001',
      'tenant-001',
    );

    expect(proxyService.forward).toHaveBeenCalledTimes(1);
  });

  it('should skip tenant validation for an OPTIONAL route when tenant is missing', async () => {
    const optionalTenantRoute: GatewayProxyRoute = {
      ...proxyRoute,
      tenantContext: GatewayTenantContext.OPTIONAL,
    };

    const requestWithoutTenant = {
      ...request,
      user: {
        ...request.user,
        tenantId: undefined,
      },
    } as unknown as AuthenticatedRequest;

    routeResolver.resolve.mockReturnValue({
      route: optionalTenantRoute,
      params: {},
    });

    await service.dispatch(requestWithoutTenant);

    expect(tenantContextValidator.validate).not.toHaveBeenCalled();
    expect(proxyService.forward).toHaveBeenCalledTimes(1);
  });

  it('should skip tenant validation for a NONE route', async () => {
    const noTenantRoute: GatewayProxyRoute = {
      ...proxyRoute,
      tenantContext: GatewayTenantContext.NONE,
    };

    routeResolver.resolve.mockReturnValue({
      route: noTenantRoute,
      params: {},
    });

    await service.dispatch(request);

    expect(tenantContextValidator.validate).not.toHaveBeenCalled();
    expect(proxyService.forward).toHaveBeenCalledTimes(1);
  });
  it('should skip user authentication and tenant validation for a PUBLIC route', async () => {
    const publicRoute: GatewayProxyRoute = {
      ...proxyRoute,
      auth: GatewayAuthMode.PUBLIC,
      permissions: [],
      tenantContext: GatewayTenantContext.REQUIRED,
    };

    routeResolver.resolve.mockReturnValue({
      route: publicRoute,
      params: {},
    });

    await service.dispatch(request);

    expect(gatewayAuthGuard.authenticate).not.toHaveBeenCalled();

    expect(gatewayAuthorizationService.authorize).not.toHaveBeenCalled();

    expect(tenantContextValidator.validate).not.toHaveBeenCalled();

    expect(proxyService.forward).toHaveBeenCalledTimes(1);
  });

  it('should resolve an active store and create a tenant-scoped token for a STORE_SLUG route', async () => {
    const publicStoreRoute: GatewayProxyRoute = {
      ...proxyRoute,
      path: '/public/stores/:storeSlug/products',
      downstreamPath: '/api/public/stores/:storeSlug/products',
      auth: GatewayAuthMode.PUBLIC,
      permissions: [],
      tenantContext: GatewayTenantContext.NONE,
      tenantResolution: GatewayTenantResolution.STORE_SLUG,
    };

    routeResolver.resolve.mockReturnValue({
      route: publicStoreRoute,
      params: {
        storeSlug: 'petoman-store',
      },
    });

    routeResolver.getDownstreamPath.mockReturnValue(
      '/api/public/stores/petoman-store/products',
    );

    await service.dispatch(request);

    expect(tenantResolver.resolveBySlug).toHaveBeenCalledTimes(1);
    expect(tenantResolver.resolveBySlug).toHaveBeenCalledWith('petoman-store');

    expect(
      gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader,
    ).toHaveBeenCalledTimes(1);

    expect(
      gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader,
    ).toHaveBeenCalledWith(GatewayTarget.MARKET, 'tenant-001');

    expect(
      gatewayDownstreamAuthService.createAuthorizationHeader,
    ).not.toHaveBeenCalled();

    expect(proxyHeaderService.getForwardHeaders).toHaveBeenCalledWith(
      request,
      'Bearer tenant-internal-jwt-token',
    );

    expect(proxyService.forward).toHaveBeenCalledTimes(1);
  });

  it('should not forward the request when store resolution fails', async () => {
    const publicStoreRoute: GatewayProxyRoute = {
      ...proxyRoute,
      path: '/public/stores/:storeSlug/products',
      downstreamPath: '/api/public/stores/:storeSlug/products',
      auth: GatewayAuthMode.PUBLIC,
      permissions: [],
      tenantContext: GatewayTenantContext.NONE,
      tenantResolution: GatewayTenantResolution.STORE_SLUG,
    };

    routeResolver.resolve.mockReturnValue({
      route: publicStoreRoute,
      params: {
        storeSlug: 'unknown-store',
      },
    });

    tenantResolver.resolveBySlug.mockRejectedValue(
      new ForbiddenException('Store resolution failed.'),
    );

    await expect(service.dispatch(request)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(tenantResolver.resolveBySlug).toHaveBeenCalledWith('unknown-store');

    expect(
      gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader,
    ).not.toHaveBeenCalled();

    expect(proxyHeaderService.getForwardHeaders).not.toHaveBeenCalled();

    expect(proxyService.forward).not.toHaveBeenCalled();
  });

  it('should forward the original request stream for multipart requests', async () => {
    const multipartRoute: GatewayProxyRoute = {
      ...proxyRoute,
      method: 'POST',
      path: '/products',
      downstreamPath: '/api/products',
    };

    const multipartRequest = {
      ...request,
      method: 'POST',
      path: '/api/products',
      headers: {
        'content-type': 'multipart/form-data; boundary=----test-boundary',
      },
      body: {
        parsed: true,
      },
      is: jest.fn().mockReturnValue(true),
    } as unknown as AuthenticatedRequest;

    routeResolver.resolve.mockReturnValue({
      route: multipartRoute,
      params: {},
    });

    routeResolver.getDownstreamPath.mockReturnValue('/api/products');

    await service.dispatch(multipartRequest);

    expect(multipartRequest.is).toHaveBeenCalledWith('multipart/form-data');

    expect(proxyService.forward).toHaveBeenCalledTimes(1);

    expect(proxyService.forward).toHaveBeenCalledWith(
      multipartRoute,
      'POST',
      '/api/products',
      expect.any(Object),
      multipartRequest,
      multipartRequest.query,
    );
  });
});
