import {
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import type { AuthenticatedRequest } from '@petoman/security';
import { firstValueFrom } from 'rxjs';
import { TenantResolverService } from './tenant-resolver.service';

import { GatewayTarget, GatewayAuthMode } from '../routing/gateway-route.types';
import { GatewayDownstreamAuthService } from '../../../common/authentication/gateway-downstream-auth.service';
import { ProxyHeaderService } from './proxy-header.service';
import { DownstreamHttpException } from '../../../common/exceptions/downstream-http.exception';
import { ERROR_CODES } from '../../../common/constants/error-code.constants';
import { ProductImageUrlEnricherService } from './product-image-url-enricher.service';

interface UploadedProductImage {
  readonly buffer: Buffer;
  readonly size: number;
  readonly mimetype: string;
  readonly originalname: string;
}

interface ProductRequest extends AuthenticatedRequest {
  file?: UploadedProductImage;
  body: Record<string, unknown>;
}

interface ServiceConfig {
  readonly url: string;
  readonly timeoutMs: number;
}

interface DownstreamHttpError {
  response: {
    status: number;
    data: unknown;
  };
}

interface ErrorWithCode {
  code?: string;
}

interface ProductOrchestrationContext {
  readonly request: ProductRequest;
  readonly params: Record<string, string>;
}

interface ProxyJsonResponse {
  readonly type: 'json';
  readonly data: unknown;
  readonly status: number;
}

@Injectable()
export class ProductOrchestrationService {
  private readonly logger = new Logger(ProductOrchestrationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly gatewayDownstreamAuthService: GatewayDownstreamAuthService,
    private readonly proxyHeaderService: ProxyHeaderService,
    private readonly productImageUrlEnricherService: ProductImageUrlEnricherService,
    private readonly tenantResolverService: TenantResolverService,
  ) {}

  async findAll(
    context: ProductOrchestrationContext,
  ): Promise<ProxyJsonResponse> {
    const { request } = context;

    const authorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        request,
      );

    const response = await this.requestMarketRead(
      '/api/products',
      request,
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.MARKET,
        GatewayAuthMode.JWT,
        request,
      ),
    );

    const enrichedData = await this.productImageUrlEnricherService.enrich(
      response.data,
      authorization,
    );

    return {
      type: 'json',
      data: enrichedData,
      status: response.status,
    };
  }

  async findById(
    context: ProductOrchestrationContext,
  ): Promise<ProxyJsonResponse> {
    const { request, params } = context;
    const productId = params.productId;

    if (!productId?.trim()) {
      throw new BadRequestException('A valid product ID is required.');
    }

    const authorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        request,
      );

    const marketAuthorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.MARKET,
        GatewayAuthMode.JWT,
        request,
      );

    const response = await this.requestMarketRead(
      `/api/products/${encodeURIComponent(productId)}`,
      request,
      marketAuthorization,
    );

    const enrichedData = await this.productImageUrlEnricherService.enrich(
      response.data,
      authorization,
    );

    return {
      type: 'json',
      data: enrichedData,
      status: response.status,
    };
  }

  async findPublicByStoreSlug(
    context: ProductOrchestrationContext,
  ): Promise<ProxyJsonResponse> {
    const { request, params } = context;
    const storeSlug = params.storeSlug;

    if (!storeSlug?.trim()) {
      throw new BadRequestException('A valid store slug is required.');
    }

    const tenant = await this.tenantResolverService.resolveBySlug(storeSlug);

    if (tenant.status !== 'ACTIVE') {
      throw new NotFoundException('Active store not found.');
    }

    const marketAuthorization =
      this.gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader(
        GatewayTarget.MARKET,
        tenant.tenantId,
      );

    const authAuthorization =
      this.gatewayDownstreamAuthService.createTenantServiceAuthorizationHeader(
        GatewayTarget.AUTH,
        tenant.tenantId,
      );

    const response = await this.requestMarketRead(
      `/api/public/stores/${encodeURIComponent(storeSlug)}/products`,
      request,
      marketAuthorization,
    );

    const enrichedData = await this.productImageUrlEnricherService.enrich(
      response.data,
      authAuthorization,
    );

    return {
      type: 'json',
      data: enrichedData,
      status: response.status,
    };
  }

  async create(
    context: ProductOrchestrationContext,
  ): Promise<ProxyJsonResponse> {
    const { request } = context;
    const payload = this.sanitizeProductBody(request.body);

    let uploadedImageKey: string | undefined;

    if (request.file) {
      uploadedImageKey = await this.uploadImage(request);
      payload.image_key = uploadedImageKey;
    }

    let response;

    try {
      response = await this.requestMarket(
        'POST',
        '/api/products',
        request,
        payload,
      );
    } catch (error: unknown) {
      if (uploadedImageKey) {
        await this.cleanupImage(uploadedImageKey, request);
      }

      throw error;
    }

    // Use an Auth-audience token to sign product image URLs.
    const authorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        request,
      );

    const enrichedData = await this.productImageUrlEnricherService.enrich(
      response.data,
      authorization,
    );

    return {
      type: 'json',
      data: enrichedData,
      status: response.status,
    };
  }

  async update(
    context: ProductOrchestrationContext,
  ): Promise<ProxyJsonResponse> {
    const { request, params } = context;
    const productId = params.productId;

    if (!productId?.trim()) {
      throw new Error('A valid product ID is required.');
    }

    const payload = this.sanitizeProductBody(request.body);

    let uploadedImageKey: string | undefined;

    if (request.file) {
      uploadedImageKey = await this.uploadImage(request);

      payload.image_key = uploadedImageKey;
    }

    let response;

    try {
      response = await this.requestMarket(
        'PUT',
        `/api/products/${encodeURIComponent(productId)}`,
        request,
        payload,
      );
    } catch (error: unknown) {
      if (uploadedImageKey) {
        await this.cleanupImage(uploadedImageKey, request);
      }

      throw error;
    }

    const responseData = response.data;

    const previousImageKey = this.extractPreviousImageKey(responseData);

    if (
      uploadedImageKey &&
      previousImageKey &&
      uploadedImageKey !== previousImageKey
    ) {
      await this.cleanupImage(previousImageKey, request);
    }

    // Use an Auth-audience token to sign product image URLs.
    const authorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        request,
      );

    const enrichedResponseData =
      await this.productImageUrlEnricherService.enrich(
        responseData,
        authorization,
      );

    return {
      type: 'json',
      data: this.removePreviousImageKey(enrichedResponseData),
      status: response.status,
    };
  }

  private sanitizeProductBody(
    body: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return {};
    }

    const { image_key: _ignoredImageKey, ...payload } = body;

    return payload;
  }

  private async uploadImage(request: ProductRequest): Promise<string> {
    const file = request.file;

    if (!file?.buffer?.length || file.size <= 0) {
      throw new Error('A valid product image is required.');
    }

    const form = new FormData();

    form.append(
      'image',
      new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype || 'application/octet-stream',
      }),
      file.originalname || 'product-image',
    );

    const authorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        request,
      );

    const headers = this.proxyHeaderService.getForwardHeaders(
      request,
      authorization,
    );

    delete headers['content-type'];
    delete headers['content-length'];

    const service = this.getServiceConfig('auth');

    const response = await this.sendRequest<{
      imageKey?: string;
    }>({
      method: 'POST',
      url: this.buildUrl(service.url, '/api/storage/products/images'),
      headers,
      data: form,
      timeout: service.timeoutMs,
      maxBodyLength: 6 * 1024 * 1024,
    });

    if (
      typeof response.data?.imageKey !== 'string' ||
      !response.data.imageKey.trim()
    ) {
      throw new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      });
    }

    return response.data.imageKey;
  }

  private async requestMarket(
    method: 'POST' | 'PUT',
    path: string,
    request: ProductRequest,
    payload: Record<string, unknown>,
  ) {
    const authorization =
      this.gatewayDownstreamAuthService.createAuthorizationHeader(
        GatewayTarget.MARKET,
        GatewayAuthMode.JWT,
        request,
      );

    const headers = this.proxyHeaderService.getForwardHeaders(
      request,
      authorization,
    );

    delete headers['content-length'];

    headers['content-type'] = 'application/json';
    headers.accept = 'application/json';

    const service = this.getServiceConfig('market');

    return this.sendRequest<unknown>({
      method,
      url: this.buildUrl(service.url, path),
      headers,
      data: payload,
      timeout: service.timeoutMs,
      maxBodyLength: 6 * 1024 * 1024,
    });
  }

  private async cleanupImage(
    imageKey: string,
    request: ProductRequest,
  ): Promise<void> {
    try {
      const authorization =
        this.gatewayDownstreamAuthService.createAuthorizationHeader(
          GatewayTarget.AUTH,
          GatewayAuthMode.JWT,
          request,
        );

      const headers = this.proxyHeaderService.getForwardHeaders(
        request,
        authorization,
      );

      headers['content-type'] = 'application/json';
      headers.accept = 'application/json';
      delete headers['content-length'];

      const service = this.getServiceConfig('auth');

      await this.sendRequest({
        method: 'DELETE',
        url: this.buildUrl(service.url, '/api/storage/products/images'),
        headers,
        data: { imageKey },
        timeout: service.timeoutMs,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to clean up product image "${imageKey}".`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private extractPreviousImageKey(data: unknown): string | undefined {
    if (
      typeof data !== 'object' ||
      data === null ||
      !('data' in data) ||
      typeof data.data !== 'object' ||
      data.data === null ||
      !('previous_image_key' in data.data)
    ) {
      return undefined;
    }

    const key = data.data.previous_image_key;

    return typeof key === 'string' && key.trim() ? key : undefined;
  }

  private removePreviousImageKey(data: unknown): unknown {
    if (
      typeof data !== 'object' ||
      data === null ||
      !('data' in data) ||
      typeof data.data !== 'object' ||
      data.data === null ||
      Array.isArray(data.data)
    ) {
      return data;
    }

    const responseData = data.data as Record<string, unknown>;

    const { previous_image_key: _ignored, ...safeData } = responseData;

    return {
      ...data,
      data: safeData,
    };
  }

  private async sendRequest<T>(options: {
    method: string;
    url: string;
    headers: Record<string, string>;
    data?: unknown;
    params?: Record<string, unknown>;
    timeout: number;
    maxBodyLength?: number;
  }): Promise<{ data: T; status: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          ...options,
          responseType: 'json',
        }),
      );

      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      if (this.isTimeoutError(error)) {
        throw new GatewayTimeoutException({
          code: ERROR_CODES.SERVICE_TIMEOUT,
        });
      }

      if (this.isDownstreamHttpError(error)) {
        throw new DownstreamHttpException(
          this.normalizeHttpErrorResponse(error.response.data),
          error.response.status,
        );
      }

      throw new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      });
    }
  }

  private getServiceConfig(serviceName: 'auth' | 'market'): ServiceConfig {
    const service = this.configService.get<ServiceConfig>(
      `services.${serviceName}`,
      { infer: true },
    );

    if (!service) {
      throw new Error(`Service configuration not found: ${serviceName}`);
    }

    return service;
  }

  private buildUrl(baseUrl: string, path: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private isTimeoutError(error: unknown): boolean {
    return (
      this.isErrorWithCode(error) &&
      (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
    );
  }

  private isErrorWithCode(error: unknown): error is ErrorWithCode {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (typeof error.code === 'string' || typeof error.code === 'undefined')
    );
  }

  private isDownstreamHttpError(error: unknown): error is DownstreamHttpError {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
      return false;
    }

    const response = error.response;

    return (
      typeof response === 'object' &&
      response !== null &&
      'status' in response &&
      'data' in response &&
      typeof response.status === 'number'
    );
  }

  private normalizeHttpErrorResponse(
    data: unknown,
  ): string | Record<string, unknown> {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }

    return {
      code: 'DOWNSTREAM_ERROR',
      message: 'The downstream service returned an invalid error response.',
    };
  }
  private async requestMarketRead(
    path: string,
    request: ProductRequest,
    authorization: string,
  ) {
    const headers = this.proxyHeaderService.getForwardHeaders(
      request,
      authorization,
    );

    delete headers['content-length'];

    headers.accept = 'application/json';

    const service = this.getServiceConfig('market');

    return this.sendRequest<unknown>({
      method: 'GET',
      url: this.buildUrl(service.url, path),
      headers,
      params: request.query as Record<string, unknown>,
      timeout: service.timeoutMs,
    });
  }
}
