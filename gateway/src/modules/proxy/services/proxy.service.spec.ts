import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PassThrough } from 'node:stream';
import { of } from 'rxjs';

import {
  GatewayProxyRoute,
  GatewayTarget,
} from '../routing/gateway-route.types';

import { ProxyService } from './proxy.service';

describe('ProxyService', () => {
  let service: ProxyService;

  const downstreamConfig = {
    prefix: '/api',
    url: 'http://market.internal',
    timeoutMs: 5000,
  };

  const httpService = {
    request: jest.fn(),
  } as unknown as jest.Mocked<HttpService>;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  const route = {
    target: GatewayTarget.MARKET,
    responseType: 'json',
  } as GatewayProxyRoute;

  beforeEach(() => {
    jest.resetAllMocks();

    configService.get.mockReturnValue(downstreamConfig);

    httpService.request.mockReturnValue(
      of({
        data: {
          success: true,
          data: {},
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as any),
    );

    service = new ProxyService(httpService, configService);
  });

  it('should forward the original multipart stream to Axios without consuming it', async () => {
    const stream = new PassThrough();

    const headers = {
      authorization: 'Bearer internal-token',
      'content-type': 'multipart/form-data; boundary=----test-boundary',
      'content-length': '1024',
      'x-request-id': 'request-001',
    };

    const result = await service.forward(
      route,
      'POST',
      '/api/products',
      headers,
      stream,
      {},
    );

    expect(result).toEqual({
      type: 'json',
      data: {
        success: true,
        data: {},
      },
      status: 200,
    });

    expect(httpService.request).toHaveBeenCalledTimes(1);

    expect(httpService.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'http://market.internal/api/products',
        headers,
        data: stream,
        timeout: 5000,
        maxBodyLength: 6 * 1024 * 1024,
        responseType: 'json',
      }),
    );

    expect(stream.readable).toBe(true);

    stream.destroy();
  });

  it('should preserve the downstream JSON response', async () => {
    const response = {
      success: true,
      data: {
        id: 'product-001',
        name: 'Test product',
      },
    };

    httpService.request.mockReturnValue(
      of({
        data: response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {},
        },
      } as any),
    );

    const result = await service.forward(route, 'GET', '/api/products', {
      authorization: 'Bearer internal-token',
    });

    expect(result).toEqual({
      type: 'json',
      data: response,
      status: 200,
    });
  });
});
