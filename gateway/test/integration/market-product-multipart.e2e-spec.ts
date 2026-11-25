import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenValidatorService } from '@petoman/security';
import request from 'supertest';
import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from 'node:http';
import { AppModule } from '../../src/app.module';
import { RedisClientProvider } from '@petoman/infrastructure';
import { ApiResponseInterceptor } from '../../src/common/interceptors/api-response.interceptor';
import { TenantContextValidatorService } from '../../src/modules/proxy/services/tenant-context-validator.service';

describe('Gateway Integration - Product Image Orchestration', () => {
  let app: INestApplication;
  let authServer: Server;
  let marketServer: Server;

  const tokenValidator = {
    validate: jest.fn(),
  };

  const validUserToken = 'valid-product-create-user-jwt';

  const validUser = {
    sub: 'user-001',
    sid: 'session-001',
    tenantId: 'tenant-001',
    roles: ['MARKET_OWNER'],
    permissions: ['product.create', 'product.update'],
    email: 'user@example.com',
  };

  const generatedImageKey =
    'tenants/tenant-001/products/123e4567-e89b-42d3-a456-426614174000.webp';

  const clientImageKey = 'tenants/tenant-001/products/client-controlled.webp';

  let authRequests: Array<{
    method: string;
    path: string;
    authorization?: string;
    contentType?: string;
    body: Buffer;
  }> = [];

  let marketRequests: Array<{
    method: string;
    path: string;
    authorization?: string;
    contentType?: string;
    body: Buffer;
  }> = [];

  let marketShouldFail = false;

  async function readRequest(req: IncomingMessage): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  function sendJson(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, {
      'Content-Type': 'application/json',
    });

    res.end(JSON.stringify(data));
  }

  function decodeInternalToken(
    authorization: string | undefined,
  ): Record<string, unknown> {
    expect(authorization).toBeDefined();
    expect(authorization).toMatch(/^Bearer\s+/);

    const token = authorization!.replace(/^Bearer\s+/, '');
    const [, payloadBase64] = token.split('.');

    return JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  }

  beforeAll(async () => {
    // Initialize request collections before starting the mock servers.
    authRequests = [];
    marketRequests = [];

    authServer = createServer(async (req, res) => {
      const body = await readRequest(req);

      authRequests.push({
        method: req.method ?? '',
        path: req.url ?? '',
        authorization: req.headers.authorization,
        contentType: req.headers['content-type'],
        body,
      });

      if (req.method === 'POST' && req.url === '/api/storage/products/images') {
        sendJson(res, 201, {
          imageKey: generatedImageKey,
        });
        return;
      }

      if (
        req.method === 'DELETE' &&
        req.url === '/api/storage/products/images'
      ) {
        sendJson(res, 200, {
          deleted: true,
        });
        return;
      }

      sendJson(res, 404, {
        message: 'Auth test route not found.',
      });
    });

    await new Promise<void>((resolve) => {
      authServer.listen(43101, '127.0.0.1', resolve);
    });

    marketServer = createServer(async (req, res) => {
      const body = await readRequest(req);

      marketRequests.push({
        method: req.method ?? '',
        path: req.url ?? '',
        authorization: req.headers.authorization,
        contentType: req.headers['content-type'],
        body,
      });

      const isCreateRequest =
        req.method === 'POST' && req.url === '/api/products';

      const isUpdateRequest =
        req.method === 'PUT' && /^\/api\/products\/\d+$/.test(req.url ?? '');

      if (!isCreateRequest && !isUpdateRequest) {
        sendJson(res, 404, {
          message: 'Market test route not found.',
        });
        return;
      }

      if (marketShouldFail) {
        sendJson(res, 422, {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Product validation failed.',
          },
        });
        return;
      }

      if (isUpdateRequest) {
        sendJson(res, 200, {
          success: true,
          data: {
            tenant_id: 'tenant-001',
            product: {
              id: 1,
              name: 'Updated Integration Test Product',
              price: 300000,
            },
            previous_image_key:
              'tenants/tenant-001/products/123e4567-e89b-42d3-a456-426614174001.webp',
          },
        });
        return;
      }

      sendJson(res, 201, {
        success: true,
        data: {
          tenant_id: 'tenant-001',
          product: {
            id: 1,
            name: 'Integration Test Product',
            price: 250000,
          },
        },
      });
    });

    await new Promise<void>((resolve) => {
      marketServer.listen(43104, '127.0.0.1', resolve);
    });

    // Import AppModule only after environment variables are configured.

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder
      .overrideProvider(TokenValidatorService)
      .useValue(tokenValidator);

    moduleBuilder.overrideProvider(TenantContextValidatorService).useValue({
      validate: jest.fn().mockResolvedValue(undefined),
    });

    moduleBuilder.overrideProvider(RedisClientProvider).useValue({
      client: {},
    });

    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();

    app.useGlobalInterceptors(new ApiResponseInterceptor());

    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    authRequests = [];
    marketRequests = [];
    marketShouldFail = false;

    tokenValidator.validate.mockImplementation((token: string) => {
      if (token === validUserToken) {
        return validUser;
      }

      throw new UnauthorizedException();
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    await Promise.all(
      [authServer, marketServer]
        .filter((server): server is Server => Boolean(server))
        .map(
          (server) =>
            new Promise<void>((resolve, reject) => {
              server.close((error) => {
                if (error) {
                  reject(error);
                  return;
                }

                resolve();
              });
            }),
        ),
    );
  });

  it('uploads the image to Auth and creates the product in Market', async () => {
    const fileContent = Buffer.from('multipart-image-binary-test-content');

    const response = await request(app.getHttpServer())
      .post('/api/market/products')
      .set('Authorization', `Bearer ${validUserToken}`)
      .set('Accept-Language', 'en')
      .field('name', 'Integration Test Product')
      .field('price', '250000')
      .field('stock', '5')
      .field('image_key', clientImageKey)
      .attach('image', fileContent, {
        filename: 'product.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(authRequests).toHaveLength(1);
    expect(marketRequests).toHaveLength(1);

    const authUpload = authRequests[0];

    expect(authUpload.method).toBe('POST');
    expect(authUpload.path).toBe('/api/storage/products/images');
    expect(authUpload.contentType).toMatch(
      /^multipart\/form-data;\s*boundary=/,
    );
    expect(authUpload.body.indexOf(fileContent)).toBeGreaterThanOrEqual(0);

    const authPayload = decodeInternalToken(authUpload.authorization);

    expect(authPayload).toMatchObject({
      sub: 'gateway',
      type: 'internal',
      tenantId: 'tenant-001',
      iss: 'petoman-gateway',
      aud: 'petoman-auth',
    });

    const marketCreate = marketRequests[0];

    expect(marketCreate.method).toBe('POST');
    expect(marketCreate.path).toBe('/api/products');
    expect(marketCreate.contentType).toContain('application/json');

    const marketPayload = decodeInternalToken(marketCreate.authorization);

    expect(marketPayload).toMatchObject({
      sub: 'gateway',
      type: 'internal',
      tenantId: 'tenant-001',
      iss: 'petoman-gateway',
      aud: 'petoman-market',
    });

    const productBody = JSON.parse(
      marketCreate.body.toString('utf8'),
    ) as Record<string, unknown>;

    expect(productBody).toMatchObject({
      name: 'Integration Test Product',
      price: '250000',
      stock: '5',
      image_key: generatedImageKey,
    });

    expect(productBody.image_key).not.toBe(clientImageKey);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        success: true,
        data: {
          tenant_id: 'tenant-001',
          product: {
            id: 1,
            name: 'Integration Test Product',
            price: 250000,
          },
        },
      },
    });
  });

  it('deletes the uploaded image when Market product creation fails', async () => {
    marketShouldFail = true;

    const fileContent = Buffer.from('multipart-image-binary-test-content');

    await request(app.getHttpServer())
      .post('/api/market/products')
      .set('Authorization', `Bearer ${validUserToken}`)
      .set('Accept-Language', 'en')
      .field('name', 'Invalid Product')
      .field('price', '250000')
      .attach('image', fileContent, {
        filename: 'product.png',
        contentType: 'image/png',
      })
      .expect(422);

    expect(authRequests).toHaveLength(2);
    expect(marketRequests).toHaveLength(1);

    const deleteRequest = authRequests[1];

    expect(deleteRequest.method).toBe('DELETE');
    expect(deleteRequest.path).toBe('/api/storage/products/images');

    const deletePayload = JSON.parse(deleteRequest.body.toString('utf8')) as {
      imageKey: string;
    };

    expect(deletePayload).toEqual({
      imageKey: generatedImageKey,
    });

    const deleteToken = decodeInternalToken(deleteRequest.authorization);

    expect(deleteToken).toMatchObject({
      sub: 'gateway',
      type: 'internal',
      tenantId: 'tenant-001',
      iss: 'petoman-gateway',
      aud: 'petoman-auth',
    });
  });
  it('updates the product and deletes the previous image after Market succeeds', async () => {
    const fileContent = Buffer.from('updated-product-image-binary');

    const response = await request(app.getHttpServer())
      .put('/api/market/products/1')
      .set('Authorization', `Bearer ${validUserToken}`)
      .set('Accept-Language', 'en')
      .field('name', 'Updated Integration Test Product')
      .field('price', '300000')
      .attach('image', fileContent, {
        filename: 'updated-product.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(authRequests).toHaveLength(2);
    expect(marketRequests).toHaveLength(1);

    const uploadRequest = authRequests[0];

    expect(uploadRequest.method).toBe('POST');
    expect(uploadRequest.body.indexOf(fileContent)).toBeGreaterThanOrEqual(0);

    const marketUpdate = marketRequests[0];

    expect(marketUpdate.method).toBe('PUT');
    expect(marketUpdate.path).toBe('/api/products/1');

    const productBody = JSON.parse(
      marketUpdate.body.toString('utf8'),
    ) as Record<string, unknown>;

    expect(productBody).toMatchObject({
      name: 'Updated Integration Test Product',
      price: '300000',
      image_key: generatedImageKey,
    });

    const deleteRequest = authRequests[1];

    expect(deleteRequest.method).toBe('DELETE');

    const deletePayload = JSON.parse(deleteRequest.body.toString('utf8')) as {
      imageKey: string;
    };

    expect(deletePayload.imageKey).toBe(
      'tenants/tenant-001/products/123e4567-e89b-42d3-a456-426614174001.webp',
    );

    expect(response.body.data.data).not.toHaveProperty('previous_image_key');
  });

  it('deletes the new image and preserves the previous image when Market update fails', async () => {
    marketShouldFail = true;

    const fileContent = Buffer.from('failed-update-product-image');

    await request(app.getHttpServer())
      .put('/api/market/products/1')
      .set('Authorization', `Bearer ${validUserToken}`)
      .set('Accept-Language', 'en')
      .field('name', 'Invalid Updated Product')
      .field('price', '300000')
      .attach('image', fileContent, {
        filename: 'failed-update.png',
        contentType: 'image/png',
      })
      .expect(422);

    expect(authRequests).toHaveLength(2);
    expect(marketRequests).toHaveLength(1);

    expect(authRequests[0].method).toBe('POST');
    expect(authRequests[1].method).toBe('DELETE');

    const deletePayload = JSON.parse(authRequests[1].body.toString('utf8')) as {
      imageKey: string;
    };

    expect(deletePayload.imageKey).toBe(generatedImageKey);

    const marketUpdate = marketRequests[0];

    expect(marketUpdate.method).toBe('PUT');
    expect(marketUpdate.path).toBe('/api/products/1');
  });
});
