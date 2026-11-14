
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ProxyHeaderService {
  private readonly allowedHeaders = [
    'x-request-id',
    'accept-language',
    'user-agent',
  ] as const;

  getForwardHeaders(
    request: Request,
    authorization: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      authorization,
    };

    for (const headerName of this.allowedHeaders) {
      const value = request.header(headerName);

      if (value) {
        headers[headerName] = value;
      }
    }

    const contentType = request.header('content-type');

    if (contentType?.toLowerCase().startsWith('multipart/form-data')) {
      headers['content-type'] = contentType;

      const contentLength = request.header('content-length');

      if (contentLength) {
        headers['content-length'] = contentLength;
      }
    }

    return headers;
  }
}
