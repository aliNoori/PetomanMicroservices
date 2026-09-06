import { Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '@petoman/security';

import { AggregationService, AggregationContext } from './aggregation.service';

import { ProxyService } from './proxy.service';

import { ProxyHeaderService } from './proxy-header.service';

import { RouteResolverService } from './route-resolver.service';

import { GatewayDownstreamAuthService } from '../../../common/authentication/gateway-downstream-auth.service';

import { GatewayAuthorizationService } from '../../../common/authorization/gateway-authorization.service';

import {
  GatewayRouteType,
  GatewayRouteMatch,
  GatewayProxyRoute,
  GatewayAggregationRoute,
  GatewayAuthMode,
} from '../routing/gateway-route.types';
import { GatewayAuthGuard } from '../../../common/guards/gateway-auth.guard';

/**
 * Central request dispatcher for the API Gateway.
 *
 * The Dispatcher is intentionally generic.
 *
 * Responsibilities:
 *
 * - resolve route
 * - select execution strategy
 * - delegate proxy execution
 * - delegate aggregation execution
 *
 * The Dispatcher does NOT:
 *
 * - know service URLs
 * - know service prefixes
 * - know service timeouts
 * - perform route matching
 * - build downstream paths
 * - contain aggregation business logic
 */
@Injectable()
export class GatewayDispatcherService {
  constructor(
    private readonly routeResolver: RouteResolverService,

    private readonly proxyService: ProxyService,

    private readonly aggregationService: AggregationService,

    private readonly proxyHeaderService: ProxyHeaderService,

    private readonly gatewayAuthGuard: GatewayAuthGuard,

    private readonly gatewayAuthorizationService: GatewayAuthorizationService,

    private readonly gatewayDownstreamAuthService: GatewayDownstreamAuthService,
  ) {}

  /**
   * Resolve and execute an incoming request.
   */
  async dispatch(request: AuthenticatedRequest): Promise<unknown> {
    const routeMatch = this.routeResolver.resolve(request.method, request.path);

    if (routeMatch.route.auth === GatewayAuthMode.JWT) {
      this.gatewayAuthGuard.authenticate(request);

      this.gatewayAuthorizationService.authorize(request, routeMatch.route);
    }

    switch (routeMatch.route.type) {
      case GatewayRouteType.PROXY:
        return this.dispatchProxy(routeMatch.route, routeMatch, request);

      case GatewayRouteType.AGGREGATION:
        return this.dispatchAggregation(routeMatch.route, routeMatch, request);

      default: {
        const exhaustiveCheck: never = routeMatch.route;

        throw new Error('Unsupported gateway route type.');
      }
    }
  }

  /**
   * Execute a proxy route.
   */
  private async dispatchProxy(
    route: GatewayProxyRoute,
    routeMatch: GatewayRouteMatch,
    request: AuthenticatedRequest,
  ): Promise<unknown> {
    const downstreamPath = this.routeResolver.getDownstreamPath(routeMatch);

    const authorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        route.target,
        route.auth,
        request,
      );

    const headers = this.proxyHeaderService.getForwardHeaders(
      request,
      authorization,
    );

    return this.proxyService.forward(
      route,
      request.method,
      downstreamPath,
      headers,
      request.body,
      request.query as Record<string, unknown>,
    );
  }

  /**
   * Execute an aggregation route.
   */
  private async dispatchAggregation(
    route: GatewayAggregationRoute,
    routeMatch: GatewayRouteMatch,
    request: AuthenticatedRequest,
  ): Promise<unknown> {
    const handler = route.handler;

    if (!handler) {
      throw new Error(
        `Aggregation route "${route.path}" ` + `does not define a handler.`,
      );
    }

    const context: AggregationContext = {
      request,

      params: routeMatch.params,

      query: request.query as Record<string, unknown>,
    };

    return this.aggregationService.execute(handler, context);
  }
}
