import type { Request } from 'express';

import { ProxyHeaderService } from './proxy-header.service';

describe('ProxyHeaderService', () => {
  let service: ProxyHeaderService;

  beforeEach(() => {
    service = new ProxyHeaderService();
  });

  const createRequest = (
    headers: Record<string, string>,
  ): Request => {
    return {
      header: jest.fn((name: string) => headers[name.toLowerCase()]),
    } as unknown as Request;
  };

  it('should not forward the client Authorization header', () => {
    const request = createRequest({
      authorization: 'Bearer user-jwt-token',
    });

    const result = service.getForwardHeaders(
      request,
      'Bearer internal-jwt-token',
    );

    expect(result.authorization).toBe(
      'Bearer internal-jwt-token',
    );

    expect(result.authorization).not.toBe(
      'Bearer user-jwt-token',
    );
  });

  it('should use the generated internal Authorization header', () => {
    const request = createRequest({
      authorization: 'Bearer user-jwt-token',
    });

    const result = service.getForwardHeaders(
      request,
      'Bearer internal-jwt-token',
    );

    expect(result).toEqual({
      authorization: 'Bearer internal-jwt-token',
    });
  });

  it('should forward x-request-id', () => {
    const request = createRequest({
      'x-request-id': 'request-001',
    });

    const result = service.getForwardHeaders(
      request,
      'Bearer internal-jwt-token',
    );

    expect(result['x-request-id']).toBe('request-001');
  });

  it('should forward accept-language', () => {
    const request = createRequest({
      'accept-language': 'fa-IR',
    });

    const result = service.getForwardHeaders(
      request,
      'Bearer internal-jwt-token',
    );

    expect(result['accept-language']).toBe('fa-IR');
  });

  it('should not forward unauthorized headers', () => {
    const request = createRequest({
      authorization: 'Bearer user-jwt-token',
      'x-request-id': 'request-001',
      'accept-language': 'fa-IR',
      'x-user-id': 'user-001',
      'x-tenant-id': 'tenant-001',
      cookie: 'session=abc',
      'x-forwarded-for': '127.0.0.1',
    });

    const result = service.getForwardHeaders(
      request,
      'Bearer internal-jwt-token',
    );

    expect(result).toEqual({
      authorization: 'Bearer internal-jwt-token',
      'x-request-id': 'request-001',
      'accept-language': 'fa-IR',
    });
  });

  it('should only include allowed headers when values exist', () => {
    const request = createRequest({
      'x-request-id': '',
      'accept-language': '',
    });

    const result = service.getForwardHeaders(
      request,
      'Bearer internal-jwt-token',
    );

    expect(result).toEqual({
      authorization: 'Bearer internal-jwt-token',
    });
  });
});