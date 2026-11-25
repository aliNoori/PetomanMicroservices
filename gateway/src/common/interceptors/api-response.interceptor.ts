import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponse, ApiSuccessResponse } from '../types/api-response.type';
import { ApiResponsePayload } from '../types/api-response-payload.type';
import { RequestWithId } from '../middleware/request-id.middleware';
import type { Response } from 'express';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T): ApiResponse<T> | T => {
        // Binary responses must bypass the JSON envelope.
        if (response.headersSent) {
          return data;
        }
        if (Buffer.isBuffer(data)) {
          return data;
        }

        const payload = data instanceof ApiResponsePayload ? data : undefined;

        const responseData = payload ? payload.data : data;

        return {
          success: true,
          data: responseData,
          meta: {
            requestId: request.requestId,
            timestamp: new Date().toISOString(),
            ...(payload?.meta ?? {}),
          },
        } satisfies ApiSuccessResponse<T>;
      }),
    );
  }
}
