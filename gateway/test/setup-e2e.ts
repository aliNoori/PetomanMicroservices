
process.env.NODE_ENV = 'test';

process.env.AUTH_SERVICE_PREFIX = '/auth';
process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:43101';
process.env.AUTH_SERVICE_TIMEOUT_MS = '5000';

process.env.FINANCIAL_SERVICE_PREFIX = '/financial';
process.env.FINANCIAL_SERVICE_URL = 'http://127.0.0.1:3102';
process.env.FINANCIAL_SERVICE_TIMEOUT_MS = '5000';

process.env.VET_SERVICE_PREFIX = '/vet';
process.env.VET_SERVICE_URL = 'http://127.0.0.1:3103';
process.env.VET_SERVICE_TIMEOUT_MS = '5000';

process.env.MARKET_SERVICE_PREFIX = '/api/market';
process.env.MARKET_SERVICE_URL = 'http://127.0.0.1:43104';
process.env.MARKET_SERVICE_TIMEOUT_MS = '5000';

process.env.PHARMACY_SERVICE_PREFIX = '/pharmacy';
process.env.PHARMACY_SERVICE_URL = 'http://127.0.0.1:3105';
process.env.PHARMACY_SERVICE_TIMEOUT_MS = '5000';

process.env.INTERNAL_JWT_SECRET =
  'integration-test-internal-secret';
process.env.INTERNAL_JWT_ISSUER = 'petoman-gateway';
process.env.INTERNAL_JWT_MARKET_AUDIENCE = 'petoman-market';
process.env.INTERNAL_JWT_AUTH_AUDIENCE = 'petoman-auth';
process.env.INTERNAL_JWT_EXPIRES_IN_SECONDS = '60';
