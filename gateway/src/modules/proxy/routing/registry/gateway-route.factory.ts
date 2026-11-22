
import {
  GatewayAuthMode,
  GatewayRoute,
  GatewayRouteType,
  GatewayTarget,
  GatewayTenantContext,
  GatewayTenantResolution,
} from '../gateway-route.types';

export class GatewayRouteFactory {
  /**
   * Create a proxy route.
   *
   * `path` is the public Gateway path.
   *
   * `downstreamPath` is the explicit path exposed
   * by the target microservice.
   *
   * `permissions` defines Gateway-level authorization.
   */
  static proxy(
    method: string,
    path: string,
    target: GatewayTarget,
    downstreamPath: string,
    auth: GatewayAuthMode = GatewayAuthMode.JWT,
    permissions: readonly string[] = [],
    responseType: 'json' | 'binary' = 'json',
    applyServicePrefix: boolean = true,
    tenantContext: GatewayTenantContext = GatewayTenantContext.NONE,
    tenantResolution: GatewayTenantResolution = GatewayTenantResolution.NONE,
  ): GatewayRoute {
    return {
      method: method.toUpperCase(),
      path,
      type: GatewayRouteType.PROXY,
      target,
      downstreamPath,
      auth,
      permissions,
      responseType,
      applyServicePrefix,
      tenantContext,
      tenantResolution,
    };
  }

  /**
   * Create an aggregation route.
   *
   * `permissions` defines Gateway-level authorization.
   */
  static aggregation(
    method: string,
    path: string,
    handler: string,
    auth: GatewayAuthMode = GatewayAuthMode.JWT,
    permissions: readonly string[] = [],
    tenantContext: GatewayTenantContext = GatewayTenantContext.NONE,
  ): GatewayRoute {
    return {
      method: method.toUpperCase(),
      path,
      type: GatewayRouteType.AGGREGATION,
      handler,
      auth,
      permissions,
      tenantContext,
    };
  }
}
