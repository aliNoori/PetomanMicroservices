export enum GatewayRouteType {
  PROXY = 'PROXY',
  AGGREGATION = 'AGGREGATION',
}

/**
 * Target microservices available behind the API Gateway.
 */
export enum GatewayTarget {
  AUTH = 'AUTH',
  MARKET = 'MARKET',
  FINANCIAL = 'FINANCIAL',
  VET = 'VET',
  PHARMACY = 'PHARMACY',
}

export enum GatewayAuthMode {
  PUBLIC = 'PUBLIC',
  JWT = 'JWT',
}

export enum GatewayTenantContext {
  NONE = 'NONE',
  OPTIONAL = 'OPTIONAL',
  REQUIRED = 'REQUIRED',
}

export enum GatewayTenantResolution {
  NONE = 'NONE',
  STORE_SLUG = 'STORE_SLUG',
}

/**
 * Base properties shared by every Gateway route.
 */
interface GatewayRouteBase {
  /**
   * HTTP method accepted by the Gateway.
   */
  method: string;

  /**
   * Public Gateway route path.
   */
  path: string;

  /**
   * Authentication requirement for the Gateway route.
   *
   * PUBLIC:
   *   No user authentication is required.
   *
   * JWT:
   *   A valid User JWT is required.
   */
  auth: GatewayAuthMode;

  /**
   * Permissions required by the Gateway route.
   *
   * If omitted or empty, no permission check is required.
   *
   * Multiple permissions use OR semantics.
   */
  permissions?: readonly string[];

  /**
   * Tenant context validation policy.
   *
   * NONE:
   *   No tenant validation is required.
   *
   * OPTIONAL:
   *   Validate the selected tenant when one exists.
   *
   * REQUIRED:
   *   An active tenant and active membership are mandatory.
   */
  tenantContext?: GatewayTenantContext;

  /**
   * Resolves a tenant for public tenant-scoped resources.
   */
  tenantResolution?: GatewayTenantResolution;
}

/**
 * Proxy route.
 */
export interface GatewayProxyRoute extends GatewayRouteBase {
  type: GatewayRouteType.PROXY;

  /**
   * Logical target microservice.
   */
  target: GatewayTarget;

  /**
   * Explicit downstream path template.
   */
  downstreamPath: string;

  /**
   * Expected downstream response format.
   *
   * JSON is the default response format.
   * Binary is used for files and image content.
   */
  responseType?: 'json' | 'binary';

  /**
   * Whether the target service prefix should be applied
   * to this public Gateway route.
   *
   * Defaults to true.
   */
  applyServicePrefix?: boolean;
}

/**
 * Aggregation route.
 */
export interface GatewayAggregationRoute extends GatewayRouteBase {
  type: GatewayRouteType.AGGREGATION;

  /**
   * Aggregation operation identifier.
   */
  handler: string;
}

/**
 * Central Gateway Route definition.
 */
export type GatewayRoute = GatewayProxyRoute | GatewayAggregationRoute;

/**
 * Result of matching an incoming request against
 * the Gateway Route Registry.
 */
export interface GatewayRouteMatch {
  /**
   * Matched Gateway route.
   */
  route: GatewayRoute;

  /**
   * Parameters extracted from the incoming request path.
   */
  params: Record<string, string>;
}
