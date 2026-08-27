import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import {
  AUTH_ERROR_CODES,
  AuthErrorCode,
} from '../constants/auth-error-codes.constants';

export interface MappedError {
  readonly code: AuthErrorCode;
  readonly status: HttpStatus;
}

export class ErrorMapper {
  static map(
    exception: unknown,
  ): MappedError {
    // ============================================================
    // HttpException
    // ============================================================

    if (exception instanceof HttpException) {
      const status =
        exception.getStatus();

      const code =
        this.resolveHttpExceptionCode(
          exception,
          status,
        );

      return {
        code,
        status,
      };
    }

    // ============================================================
    // Unknown / Internal Error
    // ============================================================

    return {
      code:
        AUTH_ERROR_CODES.INTERNAL_SERVER_ERROR,

      status:
        HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  // ============================================================
  // Resolve HttpException Code
  // ============================================================

  private static resolveHttpExceptionCode(
    exception: HttpException,
    status: number,
  ): AuthErrorCode {
    const response =
      exception.getResponse();

    // ==========================================================
    // Explicit Auth Error Code
    // ==========================================================

    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      typeof response.code === 'string'
    ) {
      const code =
        response.code as AuthErrorCode;

      if (
        this.isAuthErrorCode(code)
      ) {
        return code;
      }
    }

    // ==========================================================
    // Generic HTTP Mapping
    // ==========================================================

    return this.resolveStatusCode(
      status,
    );
  }

  // ============================================================
  // Status -> Generic Auth Error
  // ============================================================

  private static resolveStatusCode(
    status: number,
  ): AuthErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return AUTH_ERROR_CODES.BAD_REQUEST;

      case HttpStatus.UNAUTHORIZED:
        return AUTH_ERROR_CODES.UNAUTHORIZED;

      case HttpStatus.FORBIDDEN:
        return AUTH_ERROR_CODES.FORBIDDEN;

      case HttpStatus.NOT_FOUND:
        return AUTH_ERROR_CODES.NOT_FOUND;

      case HttpStatus.CONFLICT:
        return AUTH_ERROR_CODES.CONFLICT;

      case HttpStatus.UNPROCESSABLE_ENTITY:
        return AUTH_ERROR_CODES.VALIDATION_ERROR;

      default:
        return AUTH_ERROR_CODES.INTERNAL_SERVER_ERROR;
    }
  }

  // ============================================================
  // Validate Auth Error Code
  // ============================================================

  private static isAuthErrorCode(
    code: string,
  ): code is AuthErrorCode {
    return (
      Object.values(
        AUTH_ERROR_CODES,
      ) as string[]
    ).includes(code);
  }
}