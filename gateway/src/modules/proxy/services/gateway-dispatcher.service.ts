import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

import type { AuthenticatedRequest } from '@petoman/security';

import { AggregationService, AggregationContext } from './aggregation.service';

import { ProxyService } from './proxy.service';

import { ProxyHeaderService } from './proxy-header.service';

import { RouteResolverService } from './route-resolver.service';

import { GatewayDownstreamAuthService } from '../../../common/authentication/gateway-downstream-auth.service';

import { GatewayAuthorizationService } from '../../../common/authorization/gateway-authorization.service';

import { TenantContextValidatorService } from './tenant-context-validator.service';

import {
  GatewayRouteType,
  GatewayRouteMatch,
  GatewayProxyRoute,
  GatewayAggregationRoute,
  GatewayAuthMode,
  GatewayTenantContext,
  GatewayTenantResolution,
} from '../routing/gateway-route.types';
import { GatewayAuthGuard } from '../../../common/guards/gateway-auth.guard';
import { TenantResolverService } from './tenant-resolver.service';

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

    private readonly tenantResolver: TenantResolverService,

    private readonly tenantContextValidator: TenantContextValidatorService,

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
      await this.gatewayAuthGuard.authenticate(request);

      this.gatewayAuthorizationService.authorize(request, routeMatch.route);

      const tenantContext =
        routeMatch.route.tenantContext ?? GatewayTenantContext.NONE;

      if (tenantContext === GatewayTenantContext.REQUIRED) {
        if (!request.user?.sub || !request.user.tenantId) {
          throw new ForbiddenException('An active tenant context is required.');
        }

        await this.tenantContextValidator.validate(
          request.user.sub,
          request.user.tenantId,
        );
      }

      if (
        tenantContext === GatewayTenantContext.OPTIONAL &&
        request.user?.tenantId
      ) {
        if (!request.user.sub) {
          throw new ForbiddenException('A valid user context is required.');
        }

        await this.tenantContextValidator.validate(
          request.user.sub,
          request.user.tenantId,
        );
      }
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

    let authorization: string;

    const tenantResolution =
      route.tenantResolution ?? GatewayTenantResolution.NONE;

    if (tenantResolution === GatewayTenantResolution.STORE_SLUG) {
      const storeSlug = routeMatch.params.storeSlug;

      if (typeof storeSlug !== 'string' || !storeSlug.trim()) {
        throw new BadRequestException('A valid store slug is required.');
      }

      const tenant = await this.tenantResolver.resolveBySlug(storeSlug);

      if (tenant.status !== 'ACTIVE') {
        throw new NotFoundException('Active store not found.');
      }

      authorization =
        this.gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader(
          route.target,
          tenant.tenantId,
        );
    } else {
      authorization =
        this.gatewayDownstreamAuthService.createAuthorizationHeader(
          route.target,
          route.auth,
          request,
        );
    }

    const headers = this.proxyHeaderService.getForwardHeaders(
      request,
      authorization,
    );

    const isMultipart = request.is('multipart/form-data');

    return this.proxyService.forward(
      route,
      request.method,
      downstreamPath,
      headers,
      isMultipart ? request : request.body,
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
