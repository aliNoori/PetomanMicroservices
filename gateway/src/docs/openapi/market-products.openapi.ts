import { ErrorResponseSchema } from '../schemas/error-response.schema';
import { PaginationSchema } from '../schemas/pagination.schema';
import { ProductSchema } from '../schemas/product.schema';
import { MarketProductsResponseSchema } from '../schemas/market-products-response.schema';

export const marketProductsOpenApi = {
  components: {
    schemas: {
      Product: ProductSchema,
      Pagination: PaginationSchema,
      ErrorResponse: ErrorResponseSchema,
      MarketProductsResponse: MarketProductsResponseSchema,
    },
  },

  paths: {
    '/api/market/products': {
      get: {
        tags: ['Market - Products'],

        summary: 'List market products',

        description: `
Returns a paginated list of products belonging to the authenticated market tenant.

The Gateway authenticates the request using the JWT Bearer token and forwards
the request to the Market microservice.

Pagination uses cursor-based pagination.

The maximum allowed page size is 100 products.
        `.trim(),

        operationId: 'getMarketProducts',

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: 'per_page',
            in: 'query',
            required: false,

            description:
              'Number of products to return. Must be between 1 and 100.',

            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
            },

            example: 20,
          },

          {
            name: 'cursor',
            in: 'query',
            required: false,

            description:
              'Cursor returned by a previous request. Used for cursor-based pagination.',

            schema: {
              type: 'string',
              nullable: true,
            },

            example: 'eyJpZCI6MjB9',
          },
        ],

        responses: {
          '200': {
            description: 'Products retrieved successfully.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MarketProductsResponse',
                },
              },
            },
          },

          '401': {
            description:
              'Authentication failed or JWT token is missing/invalid.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  success: false,

                  error: {
                    code: 'AUTH_UNAUTHORIZED',
                    message: 'Unauthorized.',
                  },

                  meta: {
                    requestId: 'req-01J8ABC123XYZ',
                    timestamp: '2026-08-27T11:30:00.000Z',
                  },
                },
              },
            },
          },

          '403': {
            description:
              'Authenticated user does not have permission to access market products.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },

          '422': {
            description: 'Request validation failed.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  success: false,

                  error: {
                    code: 'VALIDATION_FAILED',
                    message: 'The given data was invalid.',
                  },

                  meta: {
                    requestId: 'req-01J8ABC123XYZ',
                    timestamp: '2026-08-27T11:30:00.000Z',
                  },
                },
              },
            },
          },

          '504': {
            description:
              'The Market service did not respond within the configured timeout.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  success: false,

                  error: {
                    code: 'SERVICE_TIMEOUT',
                    message: 'Downstream service request timed out.',
                  },

                  meta: {
                    requestId: 'req-01J8ABC123XYZ',
                    timestamp: '2026-08-27T11:30:00.000Z',
                  },
                },
              },
            },
          },

          '503': {
            description: 'Market service is unavailable.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  success: false,

                  error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Downstream service is unavailable.',
                  },

                  meta: {
                    requestId: 'req-01J8ABC123XYZ',
                    timestamp: '2026-08-27T11:30:00.000Z',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
