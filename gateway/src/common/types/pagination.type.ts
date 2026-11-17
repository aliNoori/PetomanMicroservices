export interface ApiPagination {
  readonly per_page: number;
  readonly has_more: boolean;
  readonly next_cursor: string | null;
  readonly previous_cursor: string | null;
}
