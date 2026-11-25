import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  GatewayRoute,
  GatewayRouteMatch,
  GatewayRouteType,
  GatewayTarget,
} from '../gateway-route.types';

import { ParameterizedRouteTrie } from './parameterized-route-trie';

import { authRoutes } from '../routes/auth/auth.routes';

import { marketRoutes } from '../routes/market/market.routes';

import { vetRoutes } from '../routes/vet/vet.routes';

import { aggregationRoutes } from '../routes/aggregation/aggregation.routes';

interface ServiceConfig {
  readonly prefix: string;
  readonly url: string;
  readonly timeoutMs: number;
}

/**
 * Central Gateway Route Registry.
 *
 * Responsibilities:
 *
 * - collect Gateway routes
 * - resolve service prefixes
 * - build public Gateway paths
 * - register static routes
 * - register parameterized routes in Trie
 * - perform route matching
 *
 * The Registry does NOT:
 *
 * - perform HTTP requests
 * - resolve downstream URLs
 * - execute aggregation handlers
 * - contain business logic
 */
@Injectable()
export class GatewayRouteRegistry {
  /**
   * Resolved Gateway routes.
   *
   * These routes represent the actual public Gateway paths
   * registered in the Map and Trie.
   */
  private readonly routes: GatewayRoute[];

  /**
   * Static routes use O(1) Map lookup.
   */
  private readonly staticRoutes = new Map<string, GatewayRoute>();

  /**
   * Parameterized routes use Trie matching.
   */
  private readonly parameterizedRouteTrie = new ParameterizedRouteTrie();

  constructor(private readonly configService: ConfigService) {
    const declaredRoutes: GatewayRoute[] = [
      ...authRoutes,
      ...marketRoutes,
      ...vetRoutes,
      ...aggregationRoutes,
    ];

    this.routes = declaredRoutes.map((route) => this.resolveRoute(route));

    this.registerRoutes();
  }

  /**
   * Find a matching Gateway route.
   *
   * Lookup order:
   *
   * 1. Static Map
   * 2. Parameterized Trie
   *
   * Static routes therefore always have priority
   * over parameterized routes.
   */
  find(method: string, path: string): GatewayRouteMatch | undefined {
    const normalizedMethod = method.toUpperCase();

    const normalizedPath = this.normalizePath(path);

    /*
     * Static route lookup.
     */
    const staticRoute = this.staticRoutes.get(
      this.createKey(normalizedMethod, normalizedPath),
    );

    if (staticRoute) {
      return {
        route: staticRoute,
        params: {},
      };
    }

    /*
     * Parameterized route lookup.
     */
    return this.parameterizedRouteTrie.match(normalizedMethod, normalizedPath);
  }

  /**
   * Return all resolved Gateway routes.
   *
   * These are the same route definitions that are
   * registered internally in the Map and Trie.
   */
  getAll(): GatewayRoute[] {
    return [...this.routes];
  }

  /**
   * Register all resolved Gateway routes.
   */
  private registerRoutes(): void {
    for (const route of this.routes) {
      if (this.isParameterized(route.path)) {
        this.parameterizedRouteTrie.insert(route);

        continue;
      }

      const key = this.createKey(route.method, route.path);

      if (this.staticRoutes.has(key)) {
        throw new Error(`Duplicate gateway route: ${key}`);
      }

      this.staticRoutes.set(key, route);
    }
  }

  /**
   * Resolve a route into its public Gateway path.
   *
   * For proxy routes:
   *
   * service.prefix + route.path
   *
   * is used to construct the public Gateway path.
   *
   * downstreamPath remains untouched because it is
   * explicitly defined by the route.
   *
   * Example:
   *
   * route.path:
   *
   * /orders
   *
   * service.prefix:
   *
   * /api/market
   *
   * resolved Gateway path:
   *
   * /api/market/orders
   *
   * downstreamPath:
   *
   * /api/orders
   */

  private resolveRoute(route: GatewayRoute): GatewayRoute {
    if (route.type === GatewayRouteType.PROXY && !route.applyServicePrefix) {
      return route;
    }

    const target =
      route.type === GatewayRouteType.PROXY
        ? route.target
        : route.servicePrefixTarget;

    if (!target) {
      return route;
    }

    const service = this.getServiceConfig(target);

    return {
      ...route,
      path: this.joinPaths(service.prefix, route.path),
    };
  }
  /**
   * Resolve ServiceConfig from GatewayTarget.
   */
  private getServiceConfig(target: GatewayTarget): ServiceConfig {
    const serviceName = this.targetToServiceName(target);

    const config = this.configService.get<ServiceConfig>(
      `services.${serviceName}`,
      {
        infer: true,
      },
    );

    if (!config) {
      throw new Error(`Service configuration not found: ${serviceName}`);
    }

    return config;
  }

  /**
   * Map logical Gateway target
   * to central service configuration name.
   */
  private targetToServiceName(target: GatewayTarget): string {
    switch (target) {
      case GatewayTarget.AUTH:
        return 'auth';

      case GatewayTarget.MARKET:
        return 'market';

      case GatewayTarget.VET:
        return 'vet';

      case GatewayTarget.PHARMACY:
        return 'pharmacy';

      default:
        throw new Error(`Unsupported gateway target: ${target}`);
    }
  }

  /**
   * Join URL path segments safely.
   */
  private joinPaths(prefix: string, path: string): string {
    return `/${prefix}/${path}`.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
  }

  /**
   * Determine whether a route is parameterized.
   */
  private isParameterized(path: string): boolean {
    return path.split('/').some((segment) => segment.startsWith(':'));
  }

  /**
   * Normalize incoming route paths.
   *
   * Examples:
   *
   * /api/market/orders
   * //api//market//orders/
   *
   * both become:
   *
   * /api/market/orders
   */
  private normalizePath(path: string): string {
    if (!path) {
      return '/';
    }

    const normalized = `/${path}`.replace(/\/+/g, '/');

    if (normalized.length > 1) {
      return normalized.replace(/\/+$/, '');
    }

    return normalized;
  }

  /**
   * Create static route lookup key.
   */
  private createKey(method: string, path: string): string {
    return `${method.toUpperCase()} ${path}`;
  }
}
