import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';

import { I18nService } from 'nestjs-i18n';

import {
  Request,
  Response,
} from 'express';

import { ErrorMapper } from '../utils/error-mapper';

interface RequestWithId
  extends Request {
  requestId?: string;
}

interface ApiErrorResponse {
  success: false;

  error: {
    code: string;
    message: string;
  };

  meta: {
    requestId?: string;
    timestamp: string;
  };
}

@Catch()
export class GlobalExceptionFilter
  implements ExceptionFilter
{
  constructor(
    private readonly i18n: I18nService,
  ) {}

  async catch(
    exception: unknown,
    host: ArgumentsHost,
  ): Promise<void> {
    const context =
      host.switchToHttp();

    const request =
      context.getRequest<RequestWithId>();

    const response =
      context.getResponse<Response>();

    // ============================================================
    // Map Exception
    // ============================================================

    const mappedError =
      ErrorMapper.map(exception);

    // ============================================================
    // Resolve Language
    // ============================================================

    const language =
      this.resolveLanguage(request);

    // ============================================================
    // Translate
    // ============================================================

    const message =
      await this.translateError(
        mappedError.code,
        language,
      );

    // ============================================================
    // Build Response
    // ============================================================

    const errorResponse:
      ApiErrorResponse = {
        success: false,

        error: {
          code: mappedError.code,
          message,
        },

        meta: {
          requestId:
            request.requestId,
          timestamp:
            new Date().toISOString(),
        },
      };

    // ============================================================
    // Send Response
    // ============================================================

    response
      .status(mappedError.status)
      .json(errorResponse);
  }

  // ============================================================
  // Resolve Language
  // ============================================================

  private resolveLanguage(
    request: Request,
  ): string {
    const acceptLanguage =
      request.header(
        'accept-language',
      );

    if (!acceptLanguage) {
      return 'en';
    }

    return (
      acceptLanguage
        .split(',')[0]
        ?.split('-')[0]
        ?.trim()
        ?.toLowerCase() ||
      'en'
    );
  }

  // ============================================================
  // Translate Error
  // ============================================================

  private async translateError(
    code: string,
    language: string,
  ): Promise<string> {
    const key =
      `common.errors.${code}`;

    const translated =
      await this.i18n.translate(
        key,
        {
          lang: language,
        },
      );

    return typeof translated === 'string'
      ? translated
      : key;
  }
}