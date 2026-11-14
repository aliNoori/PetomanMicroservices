import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponse, ApiSuccessResponse } from '../types/api-response.type';
import { RequestWithId } from '../middleware/request-id.middleware';

@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const request = context.switchToHttp().getRequest<RequestWithId>();

    return next.handle().pipe(
      map((data: T): ApiResponse<T> | T => {
        // Binary responses must bypass the JSON envelope.
        if (Buffer.isBuffer(data)) {
          return data;
        }

        return {
          success: true,
          data,
          meta: {
            requestId: request.requestId,
            timestamp: new Date().toISOString(),
          },
        } satisfies ApiSuccessResponse<T>;
      }),
    );
  }
}
