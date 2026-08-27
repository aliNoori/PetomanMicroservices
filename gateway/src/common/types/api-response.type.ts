export interface ApiMeta {
  readonly requestId: string;
  readonly timestamp: string;
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: ApiMeta;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiError;
  readonly meta: ApiMeta;
}

export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;