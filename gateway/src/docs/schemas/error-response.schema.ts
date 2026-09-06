export const ErrorResponseSchema = {
  type: 'object',
  required: [
    'success',
    'error',
    'meta',
  ],
  properties: {
    success: {
      type: 'boolean',
      example: false,
    },

    error: {
      type: 'object',
      required: [
        'code',
        'message',
      ],
      properties: {
        code: {
          type: 'string',
          example: 'AUTH_UNAUTHORIZED',
          description:
            'Machine-readable application error code.',
        },

        message: {
          type: 'string',
          example: 'Unauthorized.',
          description:
            'Human-readable error message.',
        },

        details: {
          type: 'object',
          nullable: true,
          additionalProperties: true,
          example: null,
          description:
            'Optional additional error information.',
        },
      },
    },

    meta: {
      type: 'object',
      required: [
        'requestId',
        'timestamp',
      ],
      properties: {
        requestId: {
          type: 'string',
          example: 'req-01J8ABC123XYZ',
          description:
            'Unique request identifier used for tracing.',
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