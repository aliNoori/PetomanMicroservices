import type { ApiMeta } from './api-response.type';

export class ApiResponsePayload<T> {
  constructor(
    public readonly data: T,
    public readonly meta: Pick<ApiMeta, 'pagination'>,
  ) {}
}
