export const PaginationSchema = {
  type: 'object',
  required: [
    'per_page',
    'has_more',
    'next_cursor',
    'previous_cursor',
  ],
  properties: {
    per_page: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      example: 20,
      description:
        'Number of products requested per page. Maximum is 100.',
    },

    has_more: {
      type: 'boolean',
      example: true,
      description:
        'Indicates whether another page of products is available.',
    },

    next_cursor: {
      type: 'string',
      nullable: true,
      example: 'eyJpZCI6MjB9',
      description:
        'Cursor used to retrieve the next page.',
    },

    previous_cursor: {
      type: 'string',
      nullable: true,
      example: null,
      description:
        'Cursor used to retrieve the previous page.',
    },
  },
} as const;