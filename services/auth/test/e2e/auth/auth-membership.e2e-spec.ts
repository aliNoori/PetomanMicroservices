import { INestApplication } from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from '../../../src/app.module';

import { UserEntity } from '../../../src/modules/auth/entities/user.entity';
import { TenantEntity } from '../../../src/modules/auth/entities/tenant.entity';
import { TenantUserEntity } from '../../../src/modules/auth/entities/tenant-user.entity';
import { UserRoleEntity } from '../../../src/modules/auth/entities/user-role.entity';
import { RoleEntity } from '../../../src/modules/auth/entities/role.entity';

import {
  AuthE2ESeedHelper,
  E2E_AUTH_DATA,
} from '../../helpers/auth-e2e-seed.helper';

describe('Auth Membership Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let seedHelper: AuthE2ESeedHelper;

  /**
   * ------------------------------------------------------------
   * Test helpers
   * ------------------------------------------------------------
   */

  /**
   * Login a test user and return the global JWT.
   *
   * The global JWT intentionally has:
   *
   *   tenantId = null
   *
   * Tenant context is selected separately.
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

  /**
   * Select a Tenant context using a global JWT.
   *
   * Returns the new Tenant-context JWT.
   */
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

  /**
   * Approve a membership using the supplied JWT.
   */
  const approveMembership = async (
    token: string,
    membershipId: string = E2E_AUTH_DATA.membership.tenantBUser,
  ) => {
    return request(app.getHttpServer())
      .post(`/auth/tenant-memberships/${membershipId}/approve`)
      .set('Authorization', `Bearer ${token}`);
  };

  const rejectMembership = async (
    token: string,
    membershipId: string = E2E_AUTH_DATA.membership.tenantBUser,
  ) => {
    return request(app.getHttpServer())
      .post(`/auth/tenant-memberships/${membershipId}/reject`)
      .set('Authorization', `Bearer ${token}`);
  };

  /**
   * ------------------------------------------------------------
   * Application setup
   * ------------------------------------------------------------
   */

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
      dataSource.getRepository(UserRoleEntity),
      dataSource.getRepository(RoleEntity),
    );
  });

  /**
   * Every test starts from exactly the same
   * authorization state.
   */
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
   * SUPER_ADMIN
   *
   * Global role:
   *
   *   SUPER_ADMIN
   *
   * JWT context:
   *
   *   tenantId = null
   *
   * Expected:
   *
   *   SUPER_ADMIN can approve Tenant B membership.
   */
  it('SUPER_ADMIN can approve a Tenant B membership without tenant context', async () => {
    const globalToken = await login(E2E_AUTH_DATA.users.superAdmin);

    const response = await approveMembership(globalToken);

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.membershipId).toBe(
      E2E_AUTH_DATA.membership.tenantBUser,
    );

    expect(response.body.data.tenantId).toBe(E2E_AUTH_DATA.tenants.b);

    expect(response.body.data.status).toBe('ACTIVE');
  });

  /**
   * ============================================================
   * Scenario 2
   * ============================================================
   *
   * TENANT_ADMIN
   *
   * User:
   *
   *   security-tenant-b-admin
   *
   * Role:
   *
   *   TENANT_ADMIN
   *
   * Tenant:
   *
   *   Tenant B
   *
   * Expected:
   *
   *   Can approve Tenant B membership.
   */
  it('TENANT_ADMIN can approve a membership in the same Tenant', async () => {
    const globalToken = await login(E2E_AUTH_DATA.users.tenantBAdmin);

    const tenantToken = await selectTenant(
      globalToken,
      E2E_AUTH_DATA.tenants.b,
    );

    const response = await approveMembership(tenantToken);

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.membershipId).toBe(
      E2E_AUTH_DATA.membership.tenantBUser,
    );

    expect(response.body.data.tenantId).toBe(E2E_AUTH_DATA.tenants.b);

    expect(response.body.data.status).toBe('ACTIVE');
  });

  /**
   * ============================================================
   * Scenario 3
   * ============================================================
   *
   * TENANT_ADMIN from another Tenant.
   *
   * User:
   *
   *   security-tenant-a-admin
   *
   * JWT Tenant:
   *
   *   Tenant A
   *
   * Target membership:
   *
   *   Tenant B
   *
   * Expected:
   *
   *   RolesGuard passes because the user has
   *   TENANT_ADMIN.
   *
   *   AuthService then rejects the Tenant scope.
   *
   * Expected error:
   *
   *   AUTH_TENANT_SCOPE_FORBIDDEN
   */
  it('TENANT_ADMIN from another Tenant receives 403', async () => {
    const globalToken = await login(E2E_AUTH_DATA.users.tenantAAdmin);

    const tenantToken = await selectTenant(
      globalToken,
      E2E_AUTH_DATA.tenants.a,
    );

    const response = await approveMembership(tenantToken);

    expect(response.status).toBe(403);

    expect(response.body.code).toBe('AUTH_TENANT_SCOPE_FORBIDDEN');

    /**
     * The membership must remain PENDING.
     *
     * This is an important security assertion:
     *
     * Tenant A admin must not be able to modify
     * a Tenant B membership.
     */
    const membership = await dataSource
      .getRepository(TenantUserEntity)
      .findOne({
        where: {
          id: E2E_AUTH_DATA.membership.tenantBUser,
        },
      });

    expect(membership).toBeDefined();

    expect(membership?.status).toBe('PENDING');
  });

  /**
   * ============================================================
   * Scenario 4
   * ============================================================
   *
   * Authenticated user without required role.
   *
   * User:
   *
   *   security-tenant-user
   *
   * Membership:
   *
   *   Tenant A = ACTIVE
   *
   * Role:
   *
   *   none
   *
   * Expected:
   *
   *   RolesGuard rejects the request BEFORE
   *   Membership Authorization is evaluated.
   *
   * Expected error:
   *
   *   AUTH_ROLE_REQUIRED
   */
  it('authenticated user without required role receives 403', async () => {
    const globalToken = await login(E2E_AUTH_DATA.users.tenantUser);

    const tenantToken = await selectTenant(
      globalToken,
      E2E_AUTH_DATA.tenants.a,
    );

    const response = await approveMembership(tenantToken);

    expect(response.status).toBe(403);

    expect(response.body.code).toBe('AUTH_ROLE_REQUIRED');

    /**
     * Because RolesGuard must reject the request,
     * the membership must remain unchanged.
     */
    const membership = await dataSource
      .getRepository(TenantUserEntity)
      .findOne({
        where: {
          id: E2E_AUTH_DATA.membership.tenantBUser,
        },
      });

    expect(membership).toBeDefined();

    expect(membership?.status).toBe('PENDING');
  });

  it('TENANT_ADMIN can reject a membership in the same Tenant', async () => {
    const globalToken = await login(E2E_AUTH_DATA.users.tenantBAdmin);

    const tenantToken = await selectTenant(
      globalToken,
      E2E_AUTH_DATA.tenants.b,
    );

    const response = await rejectMembership(tenantToken);

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.membershipId).toBe(
      E2E_AUTH_DATA.membership.tenantBUser,
    );

    expect(response.body.data.tenantId).toBe(E2E_AUTH_DATA.tenants.b);

    expect(response.body.data.status).toBe('REJECTED');
  });

  it('TENANT_ADMIN without the required permission receives 403', async () => {
    /**
     * ----------------------------------------------------------
     * 1. Load Tenant B TENANT_ADMIN role
     * ----------------------------------------------------------
     */
    const tenantBRole = await dataSource
      .getRepository(RoleEntity)
      .findOneOrFail({
        where: {
          slug: 'TENANT_ADMIN',
          tenantId: E2E_AUTH_DATA.tenants.b,
        },
      });
    /**
     * ----------------------------------------------------------
     * 2. Load approve permission
     * ----------------------------------------------------------
     */
    const approvePermission = await dataSource.query(
      `
    SELECT id
    FROM permissions
    WHERE slug = $1
    `,
      ['tenant.membership.approve'],
    );

    expect(approvePermission).toHaveLength(1);

    const permissionId = approvePermission[0].id;

    /**
     * ----------------------------------------------------------
     * 3. Remove ONLY approve permission
     * ----------------------------------------------------------
     *
     * TENANT_ADMIN remains intact.
     *
     * Reject permission also remains intact.
     *
     * Therefore this test isolates PermissionsGuard.
     */
    await dataSource.query(
      `
  DELETE FROM role_permissions
  WHERE role_id = $1
    AND permission_id = $2
  `,
      [tenantBRole.id, permissionId],
    );

    try {
      /**
       * --------------------------------------------------------
       * 4. Login as Tenant B admin
       * --------------------------------------------------------
       */
      const globalToken = await login(E2E_AUTH_DATA.users.tenantBAdmin);

      /**
       * --------------------------------------------------------
       * 5. Select Tenant B
       * --------------------------------------------------------
       */
      const tenantToken = await selectTenant(
        globalToken,
        E2E_AUTH_DATA.tenants.b,
      );

      /**
       * --------------------------------------------------------
       * 6. Verify the JWT context still contains the role
       * --------------------------------------------------------
       *
       * This proves the failure is NOT RolesGuard.
       */
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.roles).toContain('TENANT_ADMIN');

      expect(profileResponse.body.data.user.permissions).not.toContain(
        'tenant.membership.approve',
      );

      /**
       * --------------------------------------------------------
       * 7. Attempt protected operation
       * --------------------------------------------------------
       */
      const response = await approveMembership(tenantToken);

      /**
       * PermissionsGuard must reject the request.
       *
       * AuthService must NOT reach the membership scope logic.
       */
      expect(response.status).toBe(403);

      expect(response.body.code).toBe('AUTH_PERMISSION_REQUIRED');

      /**
       * --------------------------------------------------------
       * 8. Membership must remain PENDING
       * --------------------------------------------------------
       */
      const membership = await dataSource
        .getRepository(TenantUserEntity)
        .findOne({
          where: {
            id: E2E_AUTH_DATA.membership.tenantBUser,
          },
        });

      expect(membership).toBeDefined();

      expect(membership?.status).toBe('PENDING');
    } finally {
      /**
       * --------------------------------------------------------
       * 9. Restore approve permission
       * --------------------------------------------------------
       *
       * Keeps the E2E database state clean and makes the test
       * safe to run repeatedly.
       */
      await dataSource.query(
        `
    INSERT INTO role_permissions (
      role_id,
      permission_id
    )
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
        [tenantBRole.id, permissionId],
      );
    }
  });

  it('TENANT_ADMIN without the reject permission receives 403', async () => {
    /**
     * ----------------------------------------------------------
     * 1. Load Tenant B TENANT_ADMIN role
     * ----------------------------------------------------------
     */
    const tenantBRole = await dataSource
      .getRepository(RoleEntity)
      .findOneOrFail({
        where: {
          slug: 'TENANT_ADMIN',
          tenantId: E2E_AUTH_DATA.tenants.b,
        },
      });

    /**
     * ----------------------------------------------------------
     * 2. Load reject permission
     * ----------------------------------------------------------
     */
    const rejectPermission = await dataSource.query(
      `
    SELECT id
    FROM permissions
    WHERE slug = $1
    `,
      ['tenant.membership.reject'],
    );

    expect(rejectPermission).toHaveLength(1);

    const permissionId = rejectPermission[0].id;

    /**
     * ----------------------------------------------------------
     * 3. Remove ONLY reject permission
     * ----------------------------------------------------------
     *
     * TENANT_ADMIN remains assigned.
     *
     * Approve permission remains untouched.
     *
     * This isolates PermissionsGuard.
     */
    await dataSource.query(
      `
  DELETE FROM role_permissions
  WHERE role_id = $1
    AND permission_id = $2
  `,
      [tenantBRole.id, permissionId],
    );

    try {
      /**
       * --------------------------------------------------------
       * 4. Login as Tenant B admin
       * --------------------------------------------------------
       */
      const globalToken = await login(E2E_AUTH_DATA.users.tenantBAdmin);

      /**
       * --------------------------------------------------------
       * 5. Select Tenant B
       * --------------------------------------------------------
       */
      const tenantToken = await selectTenant(
        globalToken,
        E2E_AUTH_DATA.tenants.b,
      );

      /**
       * --------------------------------------------------------
       * 6. Verify role exists but reject permission does not
       * --------------------------------------------------------
       */
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.tenantId).toBe(
        E2E_AUTH_DATA.tenants.b,
      );

      expect(profileResponse.body.data.user.roles).toContain('TENANT_ADMIN');

      expect(profileResponse.body.data.user.permissions).not.toContain(
        'tenant.membership.reject',
      );

      /**
       * --------------------------------------------------------
       * 7. Attempt Reject
       * --------------------------------------------------------
       */
      const response = await request(app.getHttpServer())
        .post(
          `/auth/tenant-memberships/${E2E_AUTH_DATA.membership.tenantBUser}/reject`,
        )
        .set('Authorization', `Bearer ${tenantToken}`);

      /**
       * PermissionsGuard must reject the request.
       */
      expect(response.status).toBe(403);

      expect(response.body.code).toBe('AUTH_PERMISSION_REQUIRED');

      /**
       * --------------------------------------------------------
       * 8. Membership must remain PENDING
       * --------------------------------------------------------
       */
      const membership = await dataSource
        .getRepository(TenantUserEntity)
        .findOne({
          where: {
            id: E2E_AUTH_DATA.membership.tenantBUser,
          },
        });

      expect(membership).toBeDefined();

      expect(membership?.status).toBe('PENDING');
    } finally {
      /**
       * --------------------------------------------------------
       * 9. Restore reject permission
       * --------------------------------------------------------
       */
      await dataSource.query(
        `
    INSERT INTO role_permissions (
      role_id,
      permission_id
    )
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
        [tenantBRole.id, permissionId],
      );
    }
  });

  it('TENANT_ADMIN from another Tenant cannot reject a membership', async () => {
    /**
     * ----------------------------------------------------------
     * 1. Login as Tenant A admin
     * ----------------------------------------------------------
     */
    const globalToken = await login(E2E_AUTH_DATA.users.tenantAAdmin);
    /**
     * ----------------------------------------------------------
     * 2. Select Tenant A
     * ----------------------------------------------------------
     *
     * The target membership belongs to Tenant B.
     */
    const tenantToken = await selectTenant(
      globalToken,
      E2E_AUTH_DATA.tenants.a,
    );

    /**
     * ----------------------------------------------------------
     * 3. Verify Tenant A JWT context
     * ----------------------------------------------------------
     *
     * This user has TENANT_ADMIN for Tenant A.
     */
    const profileResponse = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(200);

    expect(profileResponse.body.data.user.tenantId).toBe(
      E2E_AUTH_DATA.tenants.a,
    );

    expect(profileResponse.body.data.user.roles).toContain('TENANT_ADMIN');

    /**
     * ----------------------------------------------------------
     * 4. Verify target membership belongs to Tenant B
     * ----------------------------------------------------------
     */
    const membershipBefore = await dataSource
      .getRepository(TenantUserEntity)
      .findOne({
        where: {
          id: E2E_AUTH_DATA.membership.tenantBUser,
        },
      });

    expect(membershipBefore).toBeDefined();

    expect(membershipBefore?.tenantId).toBe(E2E_AUTH_DATA.tenants.b);

    expect(membershipBefore?.status).toBe('PENDING');

    /**
     * ----------------------------------------------------------
     * 5. Attempt Reject
     * ----------------------------------------------------------
     *
     * Role:
     *   TENANT_ADMIN       -> YES
     *
     * Permission:
     *   tenant.membership.reject -> YES
     *
     * Tenant scope:
     *   Tenant A -> target Tenant B -> NO
     *
     * Therefore AuthService must reject the operation.
     */
    const response = await request(app.getHttpServer())
      .post(
        `/auth/tenant-memberships/${E2E_AUTH_DATA.membership.tenantBUser}/reject`,
      )
      .set('Authorization', `Bearer ${tenantToken}`);

    /**
     * ----------------------------------------------------------
     * 6. Assert Tenant Scope rejection
     * ----------------------------------------------------------
     */
    expect(response.status).toBe(403);

    expect(response.body.code).toBe('AUTH_TENANT_SCOPE_FORBIDDEN');

    /**
     * ----------------------------------------------------------
     * 7. Membership must remain unchanged
     * ----------------------------------------------------------
     *
     * Tenant A admin must not be able to modify
     * a Tenant B membership.
     */
    const membershipAfter = await dataSource
      .getRepository(TenantUserEntity)
      .findOne({
        where: {
          id: E2E_AUTH_DATA.membership.tenantBUser,
        },
      });

    expect(membershipAfter).toBeDefined();

    expect(membershipAfter?.tenantId).toBe(E2E_AUTH_DATA.tenants.b);

    expect(membershipAfter?.status).toBe('PENDING');
  });
});
