export const ProductSchema = {
  type: 'object',
  required: [
    'id',
    'tenant_id',
    'name',
    'description',
    'price',
    'stock',
    'is_active',
    'created_at',
    'updated_at',
  ],
  properties: {
    id: {
      type: 'integer',
      format: 'int64',
      example: 1,
      description: 'Unique product identifier.',
    },

    tenant_id: {
      type: 'string',
      example: 'tenant-market-001',
      description: 'Tenant that owns the product.',
    },

    name: {
      type: 'string',
      example: 'Premium Dog Food',
      description: 'Product name.',
    },

    description: {
      type: 'string',
      nullable: true,
      example: 'Premium food for adult dogs.',
      description: 'Product description.',
    },

    price: {
      type: 'number',
      format: 'float',
      example: 29.99,
      description: 'Current product price.',
    },

    stock: {
      type: 'integer',
      minimum: 0,
      example: 100,
      description: 'Available product stock.',
    },

    is_active: {
      type: 'boolean',
      example: true,
      description: 'Whether the product is currently active.',
    },

    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-08-27T10:30:00.000000Z',
      description: 'Product creation timestamp.',
    },

    updated_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-08-27T11:15:00.000000Z',
      description: 'Product last update timestamp.',
    },
  },
} as const;