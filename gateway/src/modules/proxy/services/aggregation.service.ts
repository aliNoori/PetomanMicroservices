import {
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { HttpService } from '@nestjs/axios';

import { firstValueFrom } from 'rxjs';

import {
  type AuthenticatedRequest,
  InternalJwtOptions,
  InternalJwtService,
} from '@petoman/security';

import {
  SERVICE_NAMES,
  ServiceName,
} from '../constants/service-route.constants';

import { ApiResponsePayload } from '../../../common/types/api-response-payload.type';

import { ERROR_CODES } from '@petoman/security';
import { TenantResolverService } from './tenant-resolver.service';
import { ConfigurationService } from '../../../config/configuration.service';

/**
 * Runtime context passed to an aggregation handler.
 *
 * The request is authenticated by JwtAuthGuard before it reaches
 * the aggregation layer.
 */
export interface AggregationContext {
  /**
   * Original authenticated Gateway request.
   *
   * Contains:
   *
   * - authenticated JWT payload through request.user
   * - original Authorization header
   */
  request: AuthenticatedRequest;

  /**
   * Parameters extracted from the matched Gateway route.
   *
   * Example:
   *
   * /users/:userId
   *
   * becomes:
   *
   * {
   *   userId: 'user-001'
   * }
   */
  params: Record<string, string>;

  /**
   * Query parameters received by the Gateway.
   */
  query: Record<string, unknown>;
}

/**
 * Central aggregation service.
 *
 * Aggregation routes are resolved by the Gateway Route Registry
 * and executed here.
 *
 * This service is responsible for orchestration between
 * downstream microservices.
 *
 * Unlike ProxyService, AggregationService is allowed to know
 * which services participate in a specific aggregation operation.
 *
 * Example:
 *
 * ME
 * ├── Auth
 * └── Market
 *
 * The Gateway combines their responses into a single response.
 */
@Injectable()
export class AggregationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tenantResolverService: TenantResolverService,
    private readonly internalJwtService: InternalJwtService,
    private readonly configurationService: ConfigurationService,
  ) {}

  /**
   * Execute an aggregation handler.
   *
   * The handler is defined by the Gateway route.
   *
   * Example:
   *
   * GET /api/me
   *
   * handler = ME
   */
  async execute(
    handler: string,
    context: AggregationContext,
  ): Promise<unknown> {
    switch (handler) {
      case 'ME':
        return this.aggregateMe(context);

      case 'DASHBOARD':
        return this.aggregateDashboard(context);

      case 'MARKET_PRODUCTS':
        return this.aggregateMarketProducts(context);

      case 'MARKET_HOME_PRODUCTS':
        return this.aggregateMarketHomeProducts(context);

      default:
        throw new Error(`Unknown aggregation handler: ${handler}`);
    }
  }

  /**
   * Aggregate the authenticated user with their orders.
   *
   * Source of truth:
   *
   * Auth
   *   → user information
   *
   * Market
   *   → order information
   *
   * The Gateway only orchestrates these calls
   * and builds the unified response.
   */
  private async aggregateMe(context: AggregationContext): Promise<unknown> {
    /*
     * The original Authorization header is required
     * because downstream services independently validate
     * the authenticated request.
     */
    const authorization = context.request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
      });
    }

    /*
     * JwtAuthGuard should already have populated
     * request.user.
     *
     * AuthenticatedRequest guarantees the expected
     * JWT payload type at compile time.
     */
    const userId = context.request.user?.sub;

    if (!userId) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
      });
    }

    /*
     * Resolve downstream service configuration
     * from the central configuration.
     */
    const authService = this.getServiceConfig(SERVICE_NAMES.AUTH);

    const marketService = this.getServiceConfig(SERVICE_NAMES.MARKET);

    /*
     * Auth and Market requests are independent.
     *
     * Execute them concurrently instead of waiting
     * for Auth to finish before requesting Market.
     */
    try {
      const [userResponse, ordersResponse] = await Promise.all([
        /*
         * Fetch authenticated user information.
         */
        firstValueFrom(
          this.httpService.get(
            this.buildServiceUrl(
              authService,
              `/users/${encodeURIComponent(userId)}`,
            ),
            {
              timeout: authService.timeoutMs,

              headers: {
                Authorization: authorization,
              },
            },
          ),
        ),

        /*
         * Fetch user's orders.
         *
         * The original Bearer token is forwarded
         * to Market so Market can independently
         * validate the request.
         */
        firstValueFrom(
          this.httpService.get(
            this.buildDownstreamUrl(marketService, '/api/orders'),
            {
              timeout: marketService.timeoutMs,

              headers: {
                Authorization: authorization,
              },
            },
          ),
        ),
      ]);

      /*
       * Build the unified Gateway response.
       *
       * Downstream response envelopes are intentionally
       * removed here.
       */
      return {
        ...userResponse.data.data,

        orders: ordersResponse.data.data.orders,
      };
    } catch (error: unknown) {
      /*
       * Downstream services communicate through HTTP.
       *
       * Errors are translated into the Gateway's
       * standard error model instead of leaking as generic
       * INTERNAL_SERVER_ERROR responses.
       */
      throw this.translateDownstreamError(error);
    }
  }

  /**
   * Dashboard aggregation entry point.
   *
   * Additional downstream services can be orchestrated here
   * without creating a separate AggregationService class
   * for every endpoint.
   */
  private async aggregateDashboard(
    _context: AggregationContext,
  ): Promise<unknown> {
    return {
      message: 'Dashboard aggregation',
    };
  }

  private async aggregateMarketProducts(
    context: AggregationContext,
  ): Promise<unknown> {
    const storeSlug = context.query.storeSlug;

    if (typeof storeSlug !== 'string' || !storeSlug.trim()) {
      throw new BadRequestException({
        code: ERROR_CODES.BAD_REQUEST,
      });
    }

    try {
      /**
       * Resolve the tenant from Auth using the public store slug.
       */
      const tenant = await this.tenantResolverService.resolveBySlug(
        storeSlug.trim(),
      );

      if (tenant.status !== 'ACTIVE') {
        throw new NotFoundException({
          code: ERROR_CODES.NOT_FOUND,
        });
      }

      /**
       * Create an internal JWT scoped to the resolved tenant.
       *
       * The user JWT is intentionally NOT forwarded to Market.
       */
      const marketJwtOptions: InternalJwtOptions = {
        secret: this.configurationService.internalJwt.secret,
        issuer: this.configurationService.internalJwt.issuer,
        audience: this.configurationService.internalJwt.marketAudience,
        expiresInSeconds:
          this.configurationService.internalJwt.expiresInSeconds,
      };

      const internalToken = this.internalJwtService.signTenantToken(
        tenant.tenantId,
        marketJwtOptions,
      );

      /**
       * Resolve Market service configuration.
       */
      const marketService = this.getServiceConfig(SERVICE_NAMES.MARKET);

      /**
       * Request products from Market using the
       * Gateway-generated internal JWT.
       */
      const productsResponse = await firstValueFrom(
        this.httpService.get(
          this.buildDownstreamUrl(marketService, '/api/public/products'),
          {
            timeout: marketService.timeoutMs,
            headers: {
              Authorization: `Bearer ${internalToken}`,
              Accept: 'application/json',
            },
          },
        ),
      );

      /**
       * Return the downstream payload without
       * leaking the internal authentication details.
       */
      return productsResponse.data.data;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('MARKET_PRODUCTS AGGREGATION ERROR:', error);

      throw this.translateDownstreamError(error);
    }
  }

    private async aggregateMarketHomeProducts(
    context: AggregationContext,
  ): Promise<unknown> {
    try {
      // Resolve active tenants from Auth.
      const tenants = await this.tenantResolverService.resolveActiveTenants();

      if (tenants.length === 0) {
        return new ApiResponsePayload(
          {
            tenants: [],
            products: [],
          },
          {
            pagination: null,
          },
        );
      }

      // Create a global internal JWT for Market.
      const marketJwtOptions: InternalJwtOptions = {
        secret: this.configurationService.internalJwt.secret,
        issuer: this.configurationService.internalJwt.issuer,
        audience: this.configurationService.internalJwt.marketAudience,
        expiresInSeconds:
          this.configurationService.internalJwt.expiresInSeconds,
      };

      const internalToken =
        this.internalJwtService.signServiceToken(marketJwtOptions);

      const marketService = this.getServiceConfig(SERVICE_NAMES.MARKET);

      // Request products from all active tenants in one call.
      const productsResponse = await firstValueFrom(
        this.httpService.post(
          this.buildDownstreamUrl(
            marketService,
            '/api/internal/public/home-products',
          ),
          {
            tenant_ids: tenants.map((tenant) => tenant.id),
            per_page: context.query.perPage,
            cursor: context.query.cursor,
          },
          {
            timeout: marketService.timeoutMs,
            headers: {
              Authorization: `Bearer ${internalToken}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return new ApiResponsePayload(
        {
          tenants,
          ...productsResponse.data.data,
        },
        {
          pagination: productsResponse.data.meta?.pagination ?? null,
        },
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('MARKET_HOME_PRODUCTS AGGREGATION ERROR:', error);

      throw this.translateDownstreamError(error);
    }
  }

  /**
   * Translate downstream HTTP errors into
   * standardized Gateway exceptions.
   *
   * This keeps AggregationService behavior consistent
   * with ProxyService.
   */
  private translateDownstreamError(error: unknown): Error {
    if (this.isUnauthorizedError(error)) {
      return new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
      });
    }
    /*
     * A downstream timeout means the service did not
     * respond within its configured timeout window.
     */
    if (this.isTimeoutError(error)) {
      return new GatewayTimeoutException({
        code: ERROR_CODES.SERVICE_TIMEOUT,
      });
    }

    /*
     * A downstream 404 means the requested resource
     * does not exist.
     */
    if (this.isNotFoundError(error)) {
      return new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
      });
    }

    /*
     * Connection-level failures mean the downstream
     * service is unavailable.
     */
    if (this.isConnectionError(error)) {
      return new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      });
    }

    /*
     * Unknown downstream failures are intentionally
     * converted to the standard Gateway internal error.
     */
    return new InternalServerErrorException({
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }

  /**
   * Determine whether the downstream request
   * failed because of a timeout.
   */
  private isTimeoutError(error: unknown): boolean {
    if (!this.isHttpClientError(error)) {
      return false;
    }

    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET'
    );
  }

  /**
   * Determine whether the downstream service
   * could not be reached.
   */
  private isConnectionError(error: unknown): boolean {
    if (!this.isHttpClientError(error)) {
      return false;
    }

    return (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EHOSTUNREACH' ||
      error.code === 'ENETUNREACH'
    );
  }

  /**
   * Determine whether the downstream service
   * returned HTTP 404.
   */
  private isNotFoundError(error: unknown): boolean {
    if (!this.isHttpClientError(error)) {
      return false;
    }

    return error.response?.status === 404;
  }

  /**
   * Narrow an unknown error to an HTTP client error.
   *
   * Axios errors are produced internally by Nest's HttpService,
   * but this service intentionally does not import AxiosError
   * directly.
   *
   * This keeps AggregationService independent from Axios-specific
   * type imports while still allowing safe inspection of
   * response status and network error codes.
   */
  private isHttpClientError(error: unknown): error is {
    code?: string;

    response?: {
      status?: number;
    };
  } {
    return typeof error === 'object' && error !== null;
  }

  /**
   * Resolve a downstream service configuration.
   *
   * Service configuration remains centralized in ConfigService.
   *
   * This is intentionally different from GatewayRouteRegistry:
   *
   * GatewayRouteRegistry
   *   → knows route structure only
   *
   * AggregationService
   *   → is allowed to resolve services required
   *      for a business aggregation.
   */
  private getServiceConfig(serviceName: ServiceName) {
    const config = this.configService.get<{
      prefix: string;
      url: string;
      timeoutMs: number;
    }>(`services.${serviceName}`, {
      infer: true,
    });

    if (!config) {
      throw new Error(`Service configuration not found: ${serviceName}`);
    }

    return config;
  }

  /**
   * Build a complete downstream service URL.
   *
   * Example:
   *
   * base:
   *   http://localhost:3001
   *
   * prefix:
   *   /api/auth
   *
   * path:
   *   /users/user-001
   *
   * result:
   *   http://localhost:3001/api/auth/users/user-001
   */
  private buildServiceUrl(
    service: {
      prefix: string;
      url: string;
      timeoutMs: number;
    },
    path: string,
  ): string {
    const baseUrl = service.url.replace(/\/+$/, '');

    const prefix = service.prefix.replace(/^\/+/, '').replace(/\/+$/, '');

    const normalizedPath = path.replace(/^\/+/, '');

    return `${baseUrl}/${prefix}/${normalizedPath}`;
  }

  /**
   * Build a downstream service URL without using
   * the service Gateway prefix.
   *
   * This is used by aggregation handlers when the
   * downstream endpoint is explicitly defined.
   *
   * Example:
   *
   * service.url:
   *   http://127.0.0.1:3004
   *
   * downstreamPath:
   *   /api/orders
   *
   * result:
   *   http://127.0.0.1:3004/api/orders
   */
  private buildDownstreamUrl(
    service: {
      url: string;
    },
    path: string,
  ): string {
    const baseUrl = service.url.replace(/\/+$/, '');

    const normalizedPath = path.replace(/^\/+/, '');

    return `${baseUrl}/${normalizedPath}`;
  }

  private isUnauthorizedError(error: unknown): boolean {
    if (!this.isAxiosError(error)) {
      return false;
    }

    return error.response?.status === 401;
  }

  private isAxiosError(error: unknown): error is {
    isAxiosError: true;
    code?: string;
    response?: {
      status?: number;
    };
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      error.isAxiosError === true
    );
  }
}
