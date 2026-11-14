import { All, Controller, Req, Res } from '@nestjs/common';

import type { Response } from 'express';
import type { AuthenticatedRequest } from '@petoman/security';

import { GatewayDispatcherService } from '../services/gateway-dispatcher.service';
import type { ProxyBinaryResponse } from '../services/proxy.service';

/**
 * Main API Gateway controller.
 *
 * All incoming API requests are delegated to the central Dispatcher.
 */
@Controller('api')
export class ProxyController {
  constructor(private readonly gatewayDispatcher: GatewayDispatcherService) {}

  /**
   * Central entry point for all API Gateway requests.
   */
  @All('{*path}')
  async handle(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const result = await this.gatewayDispatcher.dispatch(request);

    if (this.isBinaryResponse(result)) {
      response.status(result.status);

      if (result.headers.contentType) {
        response.setHeader('Content-Type', result.headers.contentType);
      }

      if (result.headers.contentLength) {
        response.setHeader('Content-Length', result.headers.contentLength);
      }

      if (result.headers.cacheControl) {
        response.setHeader('Cache-Control', result.headers.cacheControl);
      }

      if (result.headers.contentDisposition) {
        response.setHeader(
          'Content-Disposition',
          result.headers.contentDisposition,
        );
      }

      response.end(result.data);
      return;
    }

    return result;
  }

  private isBinaryResponse(value: unknown): value is ProxyBinaryResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'binary' &&
      'data' in value &&
      Buffer.isBuffer(value.data)
    );
  }
}
