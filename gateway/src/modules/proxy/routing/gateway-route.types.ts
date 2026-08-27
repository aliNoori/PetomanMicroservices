export enum GatewayRouteType {
  PROXY = 'PROXY',
  AGGREGATION = 'AGGREGATION',
}


/**
 * Target microservices available behind the API Gateway.
 *
 * GatewayTarget identifies a logical downstream service.
 *
 * Runtime service configuration such as:
 *
 * - URL
 * - prefix
 * - timeout
 *
 * remains centralized inside services.config.ts.
 */
export enum GatewayTarget {
  AUTH = 'AUTH',
  MARKET = 'MARKET',
  VET = 'VET',
  PHARMACY = 'PHARMACY',
}

export enum GatewayAuthMode {
  PUBLIC = 'PUBLIC',
  JWT = 'JWT',
}


/**
 * Base properties shared by every Gateway route.
 */
interface GatewayRouteBase {

  /**
   * HTTP method accepted by the Gateway.
   *
   * Example:
   *
   * GET
   * POST
   * PUT
   * DELETE
   */
  method: string;


  /**
   * Public Gateway route path.
   *
   * This path is resolved by GatewayRouteRegistry
   * against the target service prefix.
   *
   * Example:
   *
   * /orders
   *
   * may become:
   *
   * /api/market/orders
   */
  path: string;

  /**
   * Authentication requirement for the Gateway route.
   *
   * PUBLIC:
   *   No JWT is required at Gateway level.
   *
   * JWT:
   *   Valid JWT must exist.
   *
   * Authorization such as roles, permissions and tenant scope
   * remains the responsibility of the downstream service.
   */
  auth: GatewayAuthMode;

}


/**
 * Proxy route.
 *
 * A proxy route always points to a downstream microservice
 * and always defines an explicit downstream path.
 *
 * Keeping downstreamPath explicit is important because the
 * public Gateway API and the downstream microservice API
 * do not necessarily have the same URL structure.
 *
 * Example:
 *
 * Gateway:
 *
 *   /api/market/orders
 *
 * Downstream:
 *
 *   /api/orders
 */
export interface GatewayProxyRoute
  extends GatewayRouteBase {

  type: GatewayRouteType.PROXY;


  /**
   * Logical target microservice.
   *
   * The actual service URL is resolved from ServicesConfig.
   */
  target: GatewayTarget;


  /**
   * Explicit downstream path template.
   *
   * Route parameters are supported.
   *
   * Example:
   *
   * /api/orders/:orderId
   *
   * Gateway request:
   *
   * /api/market/orders/order-001
   *
   * becomes:
   *
   * /api/orders/order-001
   */
  downstreamPath: string;

}


/**
 * Aggregation route.
 *
 * Aggregation routes do not point directly to a downstream
 * microservice.
 *
 * Instead, they identify an operation handled by AggregationService.
 *
 * Example:
 *
 * GET /api/me
 *
 * handler:
 *
 * ME
 */
export interface GatewayAggregationRoute
  extends GatewayRouteBase {

  type: GatewayRouteType.AGGREGATION;


  /**
   * Aggregation operation identifier.
   *
   * Examples:
   *
   * ME
   * DASHBOARD
   */
  handler: string;

}


/**
 * Central Gateway Route definition.
 *
 * This is a discriminated union based on `type`.
 *
 * Therefore TypeScript automatically narrows the route:
 *
 * if route.type === PROXY
 *
 * then:
 *
 * - route.target exists
 * - route.downstreamPath exists
 *
 * and if route.type === AGGREGATION
 *
 * then:
 *
 * - route.handler exists
 */
export type GatewayRoute =
  | GatewayProxyRoute
  | GatewayAggregationRoute;


/**
 * Result of matching an incoming request against
 * the Gateway Route Registry.
 *
 * Example:
 *
 * Request:
 *
 * GET /api/market/orders/order-001
 *
 * Match:
 *
 * {
 *   route: {
 *     method: 'GET',
 *     path: '/api/market/orders/:orderId',
 *     type: 'PROXY',
 *     target: GatewayTarget.MARKET,
 *     downstreamPath: '/api/orders/:orderId'
 *   },
 *
 *   params: {
 *     orderId: 'order-001'
 *   }
 * }
 */
export interface GatewayRouteMatch {

  /**
   * Matched Gateway route.
   */
  route: GatewayRoute;


  /**
   * Parameters extracted from the incoming request path.
   *
   * Example:
   *
   * /orders/:orderId
   *
   * request:
   *
   * /orders/order-001
   *
   * result:
   *
   * {
   *   orderId: 'order-001'
   * }
   */
  params: Record<string, string>;

}