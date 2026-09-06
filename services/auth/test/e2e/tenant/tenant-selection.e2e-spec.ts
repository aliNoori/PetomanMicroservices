import { INestApplication } from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from './../src/app.module';

import { UserEntity } from '../src/modules/auth/entities/user.entity';
import { TenantEntity } from '../src/modules/auth/entities/tenant.entity';
import { TenantUserEntity } from '../src/modules/auth/entities/tenant-user.entity';

import {
  AuthE2ESeedHelper,
  E2E_AUTH_DATA,
} from './helpers/auth-e2e-seed.helper';

describe('Tenant Selection Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let seedHelper: AuthE2ESeedHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    dataSource = app.get(DataSource);

    seedHelper = new AuthE2ESeedHelper(
      dataSource.getRepository(UserEntity),
      dataSource.getRepository(TenantEntity),
      dataSource.getRepository(TenantUserEntity),
      dataSource.getRepository(
        require('../src/modules/auth/entities/user-role.entity').UserRoleEntity,
      ),
      dataSource.getRepository(
        require('../src/modules/auth/entities/role.entity').RoleEntity,
      ),
    );
  });

  beforeEach(async () => {
    await seedHelper.resetAuthSecurityState();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // Test 1
  // ACTIVE membership -> selection succeeds
  // ============================================================

  it('user with ACTIVE membership can select the Tenant', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: E2E_AUTH_DATA.users.tenantUser,
        password: E2E_AUTH_DATA.password,
      })
      .expect(201);
    const globalToken = loginResponse.body.data.accessToken;

    const response = await request(app.getHttpServer())
      .post('/auth/tenant/select')
      .set('Authorization', `Bearer ${globalToken}`)
      .send({
        tenantId: E2E_AUTH_DATA.tenants.a,
      })
      .expect(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.tenant.id).toBe(E2E_AUTH_DATA.tenants.a);

    expect(response.body.data.accessToken).toBeDefined();
  });

  // ============================================================
  // Test 2
  // No membership -> 403
  // ============================================================

  it('user without membership cannot select the Tenant', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: E2E_AUTH_DATA.users.tenantUser,
        password: E2E_AUTH_DATA.password,
      })
      .expect(201);
    const globalToken = loginResponse.body.data.accessToken;

    const response = await request(app.getHttpServer())
      .post('/auth/tenant/select')
      .set('Authorization', `Bearer ${globalToken}`)
      .send({
        tenantId: '00000000-0000-0000-0000-000000000001',
      })
      .expect(403);

    expect(response.body.code).toBe('AUTH_TENANT_MEMBERSHIP_REQUIRED');
  });

  // ============================================================
  // Test 3
  // PENDING membership -> 403
  // ============================================================

  it('user with PENDING membership cannot select the Tenant', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: E2E_AUTH_DATA.users.tenantUser,
        password: E2E_AUTH_DATA.password,
      })
      .expect(201);
    const globalToken = loginResponse.body.data.accessToken;

    const response = await request(app.getHttpServer())
      .post('/auth/tenant/select')
      .set('Authorization', `Bearer ${globalToken}`)
      .send({
        tenantId: E2E_AUTH_DATA.tenants.b,
      })
      .expect(403);

    expect(response.body.code).toBe('AUTH_TENANT_MEMBERSHIP_REQUIRED');
  });

  // ============================================================
  // Test 4
  // Inactive Tenant -> 401
  // ============================================================

  it('user cannot select an inactive Tenant', async () => {
    await dataSource.getRepository(TenantEntity).update(
      {
        id: E2E_AUTH_DATA.tenants.a,
      },
      {
        isActive: false,
      },
    );
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: E2E_AUTH_DATA.users.tenantUser,
        password: E2E_AUTH_DATA.password,
      })
      .expect(201);

    const globalToken = loginResponse.body.data.accessToken;

    const response = await request(app.getHttpServer())
      .post('/auth/tenant/select')
      .set('Authorization', `Bearer ${globalToken}`)
      .send({
        tenantId: E2E_AUTH_DATA.tenants.a,
      })
      .expect(401);

    expect(response.body.code).toBe('AUTH_TENANT_INACTIVE');
  });
});
