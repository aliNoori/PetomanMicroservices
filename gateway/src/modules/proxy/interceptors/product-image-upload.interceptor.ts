import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Observable } from 'rxjs';

const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class ProductImageUploadInterceptor implements NestInterceptor {
  private readonly interceptor = FileInterceptor('image', {
    limits: {
      fileSize: MAX_PRODUCT_IMAGE_SIZE,
      files: 1,
    },
  });

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();

    const method = request.method?.toUpperCase();
    const path = request.path;

    const isProductImageRoute =
      (method === 'POST' && /^\/api\/[^/]+\/products$/.test(path)) ||
      (method === 'PUT' && /^\/api\/[^/]+\/products\/[^/]+$/.test(path));

    if (!isProductImageRoute) {
      return next.handle();
    }

    const interceptor = new this.interceptor();

    return interceptor.intercept(context, next);
  }
}
