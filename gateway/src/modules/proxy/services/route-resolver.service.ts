import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  GatewayRouteMatch,
  GatewayRouteType,
} from '../routing/gateway-route.types';

import {
  GatewayRouteRegistry,
} from '../routing/registry/gateway-route.registry';

import {
  ERROR_CODES,
} from '@petoman/security';


/**
 * Resolves incoming Gateway requests against the
 * central Gateway Route Registry.
 *
 * Responsibilities:
 *
 * - resolve incoming requests to GatewayRouteMatch
 * - resolve downstream paths for proxy routes
 * - replace route parameters in downstream paths
 *
 * This service does NOT:
 *
 * - know service URLs
 * - know service prefixes
 * - resolve GatewayTarget values
 * - perform HTTP requests
 * - execute aggregation handlers
 * - contain business logic
 */
@Injectable()
export class RouteResolverService {

  constructor(
    private readonly routeRegistry:
      GatewayRouteRegistry,
  ) {}


  /**
   * Resolve an incoming HTTP request.
   */
  resolve(
    method: string,
    path: string,
  ): GatewayRouteMatch {

    const routeMatch =
      this.routeRegistry.find(
        method,
        path,
      );

    if (!routeMatch) {
      throw new NotFoundException({
        code:
          ERROR_CODES.NOT_FOUND,
      });
    }

    return routeMatch;
  }


  /**
   * Resolve the final downstream path for a
   * matched proxy route.
   *
   * Example:
   *
   * Gateway:
   *   /api/market/orders/order-001
   *
   * Downstream:
   *   /api/orders/order-001
   */
  getDownstreamPath(
    routeMatch: GatewayRouteMatch,
  ): string {

    const route =
      routeMatch.route;


    if (
      route.type !==
      GatewayRouteType.PROXY
    ) {
      throw new Error(
        `Downstream path requested for non-proxy route: ` +
        `${route.method} ${route.path}`,
      );
    }


    /*
     * Proxy routes must explicitly define their
     * downstream path.
     *
     * The Gateway path and downstream path have
     * different responsibilities and must not be
     * implicitly interchangeable.
     */
    if (!route.downstreamPath) {
      throw new Error(
        `Missing downstream path for proxy route: ` +
        `${route.method} ${route.path}`,
      );
    }


    return this.replaceRouteParameters(
      route.downstreamPath,
      routeMatch.params,
    );
  }


  /**
   * Replace route parameters inside a downstream
   * path template.
   *
   * Example:
   *
   * Template:
   *   /api/orders/:orderId
   *
   * Params:
   *   {
   *     orderId: 'order-001'
   *   }
   *
   * Result:
   *   /api/orders/order-001
   */
  private replaceRouteParameters(
    path: string,
    params: Record<string, string>,
  ): string {

    return path.replace(
      /:([A-Za-z0-9_]+)/g,
      (
        _match: string,
        parameterName: string,
      ) => {

        const value =
          params[parameterName];

        if (
          value === undefined
        ) {
          throw new Error(
            `Missing route parameter "${parameterName}" ` +
            `for downstream path "${path}".`,
          );
        }

        return encodeURIComponent(
          value,
        );
      },
    );
  }

}