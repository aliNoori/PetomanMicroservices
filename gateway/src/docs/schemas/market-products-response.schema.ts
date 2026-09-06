export const MarketProductsResponseSchema = {
  type: 'object',
  required: [
    'success',
    'data',
    'meta',
  ],
  properties: {
    success: {
      type: 'boolean',
      example: true,
    },

    data: {
      type: 'object',
      required: [
        'tenant_id',
        'products',
      ],
      properties: {
        tenant_id: {
          type: 'string',
          example: 'tenant-market-001',
        },

        products: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Product',
          },
        },
      },
    },

    meta: {
      type: 'object',
      required: [
        'pagination',
        'requestId',
        'timestamp',
      ],
      properties: {
        pagination: {
          $ref: '#/components/schemas/Pagination',
        },

        requestId: {
          type: 'string',
          example: 'req-01J8ABC123XYZ',
        },

        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-08-27T11:30:00.000Z',
        },
      },
    },
  },
} as const;