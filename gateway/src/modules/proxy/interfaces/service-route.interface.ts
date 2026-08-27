export interface ServiceRoute {
  readonly name: string;
  readonly prefix: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
}