import {
  GatewayTimeoutException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { DownstreamHttpException } from '../../../common/exceptions/downstream-http.exception';

import { firstValueFrom } from 'rxjs';

import {
  GatewayProxyRoute,
  GatewayTarget,
} from '../routing/gateway-route.types';

import {
  SERVICE_NAMES,
  ServiceName,
} from '../constants/service-route.constants';

import { ERROR_CODES } from '../../../common/constants/error-code.constants';

interface ServiceConfig {
  prefix: string;
  url: string;
  timeoutMs: number;
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

@Injectable()
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================
  // Forward
  // ============================================================

  async forward(
    route: GatewayProxyRoute,
    method: string,
    downstreamPath: string,
    headers: Record<string, string>,
    body?: unknown,
    query?: Record<string, unknown>,
  ): Promise<unknown> {
    const serviceName = this.mapTargetToService(route.target);

    const service = this.getServiceConfig(serviceName);

    const url = this.buildUrl(service.url, downstreamPath);

    console.log(`[ProxyService] ${method.toUpperCase()} ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: method.toUpperCase(),
          url,
          headers,
          data: body,
          params: query,
          timeout: service.timeoutMs,
        }),
      );

      return response.data;
    } catch (error: unknown) {
      // console.error(
      //   '[ProxyService] Downstream error:',
      //   error,
      // );

      // ========================================================
      // 1. Timeout
      // ========================================================

      if (this.isTimeoutError(error)) {
        throw new GatewayTimeoutException({
          code: ERROR_CODES.SERVICE_TIMEOUT,
        });
      }

      // ========================================================
      // 2. Downstream HTTP error
      //
      // IMPORTANT:
      //
      // Preserve the original downstream:
      //
      // status: 403
      // code: AUTH_ROLE_REQUIRED
      // message: ...
      //
      // So Gateway does NOT convert it to
      // SERVICE_UNAVAILABLE.
      // ========================================================

      if (this.isDownstreamHttpError(error)) {
        console.log('[Gateway Downstream Error]', {
          status: error.response.status,
          data: error.response.data,
        });
        const status = error.response.status;

        const data = this.normalizeHttpErrorResponse(error.response.data);

        throw new DownstreamHttpException(data, status);
      }

      // ========================================================
      // 3. Network / infrastructure error
      // ========================================================

      throw new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      });
    }
  }

  // ============================================================
  // Target -> Service
  // ============================================================

  private mapTargetToService(target: GatewayTarget): ServiceName {
    switch (target) {
      case GatewayTarget.AUTH:
        return SERVICE_NAMES.AUTH;

      case GatewayTarget.MARKET:
        return SERVICE_NAMES.MARKET;

      case GatewayTarget.VET:
        return SERVICE_NAMES.VET;

      case GatewayTarget.PHARMACY:
        return SERVICE_NAMES.PHARMACY;

      default:
        throw new Error(`Unsupported Gateway target: ${target}`);
    }
  }

  // ============================================================
  // Service Configuration
  // ============================================================

  private getServiceConfig(serviceName: ServiceName): ServiceConfig {
    const service = this.configService.get<ServiceConfig>(
      `services.${serviceName}`,
      {
        infer: true,
      },
    );

    if (!service) {
      throw new Error(`Service configuration not found: ${serviceName}`);
    }

    return service;
  }

  // ============================================================
  // URL Builder
  // ============================================================

  private buildUrl(baseUrl: string, downstreamPath: string): string {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

    const normalizedPath = downstreamPath.replace(/^\/+/, '');

    return `${normalizedBaseUrl}/${normalizedPath}`;
  }

  // ============================================================
  // Timeout Detection
  // ============================================================

  private isTimeoutError(error: unknown): boolean {
    if (!this.isErrorWithCode(error)) {
      return false;
    }

    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
  }

  // ============================================================
  // Downstream HTTP Error
  // ============================================================

  private isDownstreamHttpError(error: unknown): error is DownstreamHttpError {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    if (!('response' in error)) {
      return false;
    }

    const response = error.response;

    if (typeof response !== 'object' || response === null) {
      return false;
    }

    if (!('status' in response) || !('data' in response)) {
      return false;
    }

    return typeof response.status === 'number';
  }

  // ============================================================
  // Error Code Detection
  // ============================================================

  private isErrorWithCode(error: unknown): error is ErrorWithCode {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (typeof error.code === 'string' || typeof error.code === 'undefined')
    );
  }

  // ============================================================
  // Normalize Downstream Response
  // ============================================================

  private normalizeHttpErrorResponse(
    data: unknown,
  ): string | Record<string, any> {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      return data as Record<string, any>;
    }

    return {
      code: 'DOWNSTREAM_ERROR',
      message: 'The downstream service returned an invalid error response.',
    };
  }
}
