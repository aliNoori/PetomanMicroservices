import { ForbiddenException } from '@nestjs/common';

import type { AuthenticatedRequest } from '@petoman/security';

import {
  GatewayAuthMode,
  GatewayRouteType,
  GatewayTarget,
  type GatewayProxyRoute,
} from '../routing/gateway-route.types';

import { GatewayDispatcherService } from './gateway-dispatcher.service';
import { AggregationService } from './aggregation.service';
import { ProxyService } from './proxy.service';
import { ProxyHeaderService } from './proxy-header.service';
import { RouteResolverService } from './route-resolver.service';
import { GatewayAuthGuard } from '../../../common/guards/gateway-auth.guard';
import { GatewayAuthorizationService } from '../../../common/authorization/gateway-authorization.service';
import { GatewayDownstreamAuthService } from '../../../common/authentication/gateway-downstream-auth.service';

describe('GatewayDispatcherService', () => {
  let service: GatewayDispatcherService;

  const routeResolver = {
    resolve: jest.fn(),
    getDownstreamPath: jest.fn(),
  } as unknown as jest.Mocked<RouteResolverService>;

  const proxyService = {
    forward: jest.fn(),
  } as unknown as jest.Mocked<ProxyService>;

  const aggregationService = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<AggregationService>;

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
      proxyService,
      aggregationService,
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
});
