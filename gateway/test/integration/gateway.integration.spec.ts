import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenValidatorService } from '@petoman/security';
import request from 'supertest';
import { createServer, Server } from 'node:http';

import { AppModule } from '../../src/app.module';
import { ApiResponseInterceptor } from '../../src/common/interceptors/api-response.interceptor';
import { ProxyService } from '../../src/modules/proxy/services/proxy.service';

describe('Gateway Integration - Market Products', () => {
  let app: INestApplication;
  let marketServer: Server;

  const tokenValidator = {
    validate: jest.fn(),
  };

  let receivedAuthorization: string | undefined;
  let receivedRequestPath: string | undefined;

  const validUserToken = 'valid-user-jwt';
  const noPermissionUserToken = 'no-permission-user-jwt';
  const invalidUserToken = 'invalid-user-jwt';

  const validUser = {
    sub: 'user-001',
    tenantId: 'tenant-001',
    roles: ['MARKET_OWNER'],
    permissions: ['product.read'],
    email: 'user@example.com',
  };

  const noPermissionUser = {
    sub: 'user-001',
    tenantId: 'tenant-001',
    roles: ['MARKET_OWNER'],
    permissions: [],
    email: 'user@example.com',
  };

  beforeAll(async () => {
    marketServer = createServer((req, res) => {
      receivedAuthorization = req.headers.authorization;
      receivedRequestPath = req.url;

      if (req.url?.startsWith('/api/products') && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });

        res.end(
          JSON.stringify({
            products: [
              {
                id: 'product-001',
                name: 'Premium Dog Food',
                price: 350000,
                stock: 12,
              },
            ],
          }),
        );

        return;
      }

      res.writeHead(404, {
        'Content-Type': 'application/json',
      });

      res.end(
        JSON.stringify({
          code: 'NOT_FOUND',
        }),
      );
    });

    await new Promise<void>((resolve) => {
      marketServer.listen(0, '127.0.0.1', resolve);
    });

    const address = marketServer.address();

    if (!address || typeof address === 'string') {
      throw new Error('Failed to determine Market test server address.');
    }

    process.env.MARKET_SERVICE_URL = `http://127.0.0.1:${address.port}`;

    process.env.INTERNAL_JWT_SECRET = 'integration-test-internal-secret';

    process.env.INTERNAL_JWT_ISSUER = 'petoman-gateway';

    process.env.INTERNAL_JWT_MARKET_AUDIENCE = 'petoman-market';

    process.env.INTERNAL_JWT_AUTH_AUDIENCE = 'petoman-auth';

    process.env.INTERNAL_JWT_EXPIRES_IN_SECONDS = '60';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TokenValidatorService)
      .useValue(tokenValidator)
      .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalInterceptors(new ApiResponseInterceptor());

    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    receivedAuthorization = undefined;
    receivedRequestPath = undefined;

    tokenValidator.validate.mockImplementation((token: string) => {
      switch (token) {
        case validUserToken:
          return validUser;

        case noPermissionUserToken:
          return noPermissionUser;

        default:
          throw new UnauthorizedException();
      }
    });
  });

  afterAll(async () => {
    await app.close();

    await new Promise<void>((resolve, reject) => {
      marketServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('should authenticate, authorize, create internal JWT, and proxy GET /api/market/products to Market', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/market/products')
      .set('Authorization', `Bearer ${validUserToken}`)
      .set('Accept-Language', 'en')
      .expect(200);

    expect(response.body).toBeDefined();

    expect(receivedRequestPath).toBe('/api/products');

    expect(receivedAuthorization).toBeDefined();

    expect(receivedAuthorization).toMatch(/^Bearer\s+/);

    expect(receivedAuthorization).not.toBe(`Bearer ${validUserToken}`);

    const internalToken = receivedAuthorization!.replace(/^Bearer\s+/, '');

    const [, payloadBase64] = internalToken.split('.');

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    );

    expect(payload).toMatchObject({
      sub: 'gateway',
      type: 'internal',
      tenantId: 'tenant-001',
      iss: 'petoman-gateway',
      aud: 'petoman-market',
    });

    expect(response.body).toMatchObject({
      success: true,
      data: {
        products: [
          {
            id: 'product-001',
            name: 'Premium Dog Food',
            price: 350000,
            stock: 12,
          },
        ],
      },
    });
  });

  it('should return 403 and must not call Market when user lacks product.read permission', async () => {
    await request(app.getHttpServer())
      .get('/api/market/products')
      .set('Authorization', `Bearer ${noPermissionUserToken}`)
      .expect(403);

    expect(receivedAuthorization).toBeUndefined();

    expect(receivedRequestPath).toBeUndefined();
  });

  it('should return 401 and must not call Market when User JWT is invalid', async () => {
    await request(app.getHttpServer())
      .get('/api/market/products')
      .set('Authorization', `Bearer ${invalidUserToken}`)
      .expect(401);

    expect(receivedAuthorization).toBeUndefined();

    expect(receivedRequestPath).toBeUndefined();
  });

  it('should use tenantId from the authenticated User JWT and not from client input', async () => {
    await request(app.getHttpServer())
      .get('/api/market/products?tenantId=attacker-tenant')
      .set('Authorization', `Bearer ${validUserToken}`)
      .expect(200);

    expect(receivedAuthorization).toBeDefined();

    const internalToken = receivedAuthorization!.replace(/^Bearer\s+/, '');

    const [, payloadBase64] = internalToken.split('.');

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    );

    expect(payload.tenantId).toBe('tenant-001');

    expect(payload.tenantId).not.toBe('attacker-tenant');
  });
});
