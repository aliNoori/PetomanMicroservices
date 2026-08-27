import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ProxyHeaderService {
  private readonly allowedHeaders = [
    'authorization',
    'x-request-id',
    'accept-language',
  ] as const;

  getForwardHeaders(
    request: Request,
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    for (const headerName of this.allowedHeaders) {
      const value = request.header(headerName);

      if (value) {
        headers[headerName] = value;
      }
    }

    return headers;
  }
}