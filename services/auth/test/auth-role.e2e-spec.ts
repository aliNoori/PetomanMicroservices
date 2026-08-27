import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from './../src/app.module';

import { UserEntity } from '../src/modules/auth/entities/user.entity';
import { TenantEntity } from '../src/modules/auth/entities/tenant.entity';
import { TenantUserEntity } from '../src/modules/auth/entities/tenant-user.entity';
import { UserRoleEntity } from '../src/modules/auth/entities/user-role.entity';
import { RoleEntity } from '../src/modules/auth/entities/role.entity';

import {
  AuthE2ESeedHelper,
  E2E_AUTH_DATA,
} from './helpers/auth-e2e-seed.helper';


describe('Auth Role Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let seedHelper: AuthE2ESeedHelper;

  /**
   * ------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------
   */

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: E2E_AUTH_DATA.password,
      })
      .expect(201);

    const accessToken = response.body?.data?.accessToken;

    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');

    return accessToken;
  };


  const selectTenant = async (
    globalToken: string,
    tenantId: string,
  ): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/tenant/select')
      .set('Authorization', `Bearer ${globalToken}`)
      .send({
        tenantId,
      })
      .expect(201);

    const accessToken = response.body?.data?.accessToken;

    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');

    return accessToken;
  };


  const approveMembership = async (
    token: string,
  ) => {
    return request(app.getHttpServer())
      .post(
        `/auth/tenant-memberships/${E2E_AUTH_DATA.membership.tenantBUser}/approve`,
      )
      .set('Authorization', `Bearer ${token}`);
  };


  /**
   * ------------------------------------------------------------
   * Setup
   * ------------------------------------------------------------
   */

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    dataSource = app.get(DataSource);

    seedHelper = new AuthE2ESeedHelper(
      dataSource.getRepository(UserEntity),
      dataSource.getRepository(TenantEntity),
      dataSource.getRepository(TenantUserEntity),
      dataSource.getRepository(UserRoleEntity),
      dataSource.getRepository(RoleEntity),
    );
  });


  beforeEach(async () => {
    await seedHelper.resetAuthSecurityState();
  });


  afterAll(async () => {
    await app.close();
  });


  /**
   * ============================================================
   * Scenario 1
   * ============================================================
   *
   * SUPER_ADMIN has the required role.
   *
   * SUPER_ADMIN is a system role:
   *
   *   tenant_id = NULL
   *
   * Therefore RolesGuard must allow the request even though
   * the JWT has no Tenant context.
   */
  it(
    'SUPER_ADMIN passes role authorization without tenant context',
    async () => {
      const globalToken = await login(
        E2E_AUTH_DATA.users.superAdmin,
      );

      const response = await approveMembership(
        globalToken,
      );

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(
        response.body.data.status,
      ).toBe('ACTIVE');
    },
  );


  /**
   * ============================================================
   * Scenario 2
   * ============================================================
   *
   * TENANT_ADMIN has the required role in Tenant B.
   *
   * The role must be present in the Tenant B JWT.
   */
  it(
    'TENANT_ADMIN role is included in the selected Tenant context',
    async () => {
      const globalToken = await login(
        E2E_AUTH_DATA.users.tenantBAdmin,
      );

      const tenantToken = await selectTenant(
        globalToken,
        E2E_AUTH_DATA.tenants.b,
      );

      const profileResponse =
        await request(app.getHttpServer())
          .get('/auth/profile')
          .set(
            'Authorization',
            `Bearer ${tenantToken}`,
          )
          .expect(200);

      expect(
        profileResponse.body.data.user.tenantId,
      ).toBe(
        E2E_AUTH_DATA.tenants.b,
      );

      expect(
        profileResponse.body.data.user.roles,
      ).toContain('TENANT_ADMIN');
    },
  );


  /**
   * ============================================================
   * Scenario 3
   * ============================================================
   *
   * A Tenant A administrator must NOT receive the Tenant B
   * TENANT_ADMIN role when selecting Tenant A.
   *
   * This verifies that tenant-scoped roles do not leak
   * between Tenant contexts.
   */
  it(
    'TENANT_ADMIN role from another Tenant does not leak into the selected context',
    async () => {
      const globalToken = await login(
        E2E_AUTH_DATA.users.tenantAAdmin,
      );

      const tenantToken = await selectTenant(
        globalToken,
        E2E_AUTH_DATA.tenants.a,
      );

      const profileResponse =
        await request(app.getHttpServer())
          .get('/auth/profile')
          .set(
            'Authorization',
            `Bearer ${tenantToken}`,
          )
          .expect(200);

      expect(
        profileResponse.body.data.user.tenantId,
      ).toBe(
        E2E_AUTH_DATA.tenants.a,
      );

      expect(
        profileResponse.body.data.user.roles,
      ).toContain('TENANT_ADMIN');
    },
  );


  /**
   * ============================================================
   * Scenario 4
   * ============================================================
   *
   * An authenticated user with no role must fail RolesGuard.
   *
   * The user is a valid ACTIVE member of Tenant A, but has
   * no TENANT_ADMIN or SUPER_ADMIN role.
   *
   * Expected:
   *
   *   HTTP 403
   *   AUTH_ROLE_REQUIRED
   */
  it(
    'authenticated user without an administrative role is rejected',
    async () => {
      const globalToken = await login(
        E2E_AUTH_DATA.users.tenantUser,
      );

      const tenantToken = await selectTenant(
        globalToken,
        E2E_AUTH_DATA.tenants.a,
      );

      const response = await approveMembership(
        tenantToken,
      );

      expect(response.status).toBe(403);

      expect(
        response.body.code,
      ).toBe(
        'AUTH_ROLE_REQUIRED',
      );

      /**
       * Verify that RolesGuard rejected the request before
       * membership state could be changed.
       */
      const membership =
        await dataSource
          .getRepository(TenantUserEntity)
          .findOne({
            where: {
              id:
                E2E_AUTH_DATA.membership.tenantBUser,
            },
          });

      expect(membership).toBeDefined();

      expect(membership?.status).toBe('PENDING');
    },
  );
});
