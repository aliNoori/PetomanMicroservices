import { Repository } from 'typeorm';

import { UserEntity } from '../../src/modules/auth/entities/user.entity';
import { TenantEntity } from '../../src/modules/auth/entities/tenant.entity';
import { TenantUserEntity } from '../../src/modules/auth/entities/tenant-user.entity';
import { UserRoleEntity } from '../../src/modules/auth/entities/user-role.entity';
import { RoleEntity } from '../../src/modules/auth/entities/role.entity';

export const E2E_AUTH_DATA = {
  password: 'Test1234!',

  users: {
    superAdmin:
      'security-super-admin@petoman.local',

    tenantAAdmin:
      'security-tenant-a-admin@petoman.local',

    tenantBAdmin:
      'security-tenant-b-admin@petoman.local',

    tenantUser:
      'security-tenant-user@petoman.local',
  },

  tenants: {
    a:
      '0191c537-7cac-46e1-902f-1a891a7bfccf',

    b:
      'b2b98f7a-19f7-4e48-97ea-bf2fc0949a37',
  },

  membership: {
    tenantBUser:
      '7f27aebb-49ea-43fd-bf52-d3b49e18d553',
  },
};


export class AuthE2ESeedHelper {
  constructor(
    private readonly userRepository: Repository<UserEntity>,
    private readonly tenantRepository: Repository<TenantEntity>,
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}


  /**
   * Reset only the authorization state required
   * by the authentication E2E suite.
   *
   * This method is intentionally idempotent.
   */
  async resetAuthSecurityState(): Promise<void> {
    /**
     * ----------------------------------------------------------
     * 1. Reset target membership
     * ----------------------------------------------------------
     *
     * This is the membership used by the four authorization
     * scenarios.
     *
     * Every test starts from:
     *
     *   PENDING
     */
    await this.tenantUserRepository.update(
      {
        id: E2E_AUTH_DATA.membership.tenantBUser,
      },
      {
        status: 'PENDING',
      },
    );


    /**
     * ----------------------------------------------------------
     * 2. Make sure test Tenants are active
     * ----------------------------------------------------------
     */
    await this.tenantRepository.update(
      {
        id: E2E_AUTH_DATA.tenants.a,
      },
      {
        isActive: true,
      },
    );

    await this.tenantRepository.update(
      {
        id: E2E_AUTH_DATA.tenants.b,
      },
      {
        isActive: true,
      },
    );


    /**
     * ----------------------------------------------------------
     * 3. Make sure test Users are active
     * ----------------------------------------------------------
     */
    const testEmails = [
      E2E_AUTH_DATA.users.superAdmin,
      E2E_AUTH_DATA.users.tenantAAdmin,
      E2E_AUTH_DATA.users.tenantBAdmin,
      E2E_AUTH_DATA.users.tenantUser,
    ];

    await this.userRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        isActive: true,
      })
      .where('email IN (:...emails)', {
        emails: testEmails,
      })
      .execute();


    /**
     * ----------------------------------------------------------
     * 4. Reset Tenant memberships
     * ----------------------------------------------------------
     *
     * Tenant A admin:
     *
     *   ACTIVE
     *
     * Tenant B admin:
     *
     *   ACTIVE
     *
     * Tenant user:
     *
     *   Tenant A = ACTIVE
     *   Tenant B = PENDING
     */
    const tenantA =
      E2E_AUTH_DATA.tenants.a;

    const tenantB =
      E2E_AUTH_DATA.tenants.b;


    const tenantAAdmin =
      await this.userRepository.findOneOrFail({
        where: {
          email: E2E_AUTH_DATA.users.tenantAAdmin,
        },
      });

    const tenantBAdmin =
      await this.userRepository.findOneOrFail({
        where: {
          email: E2E_AUTH_DATA.users.tenantBAdmin,
        },
      });

    const tenantUser =
      await this.userRepository.findOneOrFail({
        where: {
          email: E2E_AUTH_DATA.users.tenantUser,
        },
      });


    /**
     * Tenant A admin -> ACTIVE
     */
    await this.tenantUserRepository.update(
      {
        userId: tenantAAdmin.id,
        tenantId: tenantA,
      },
      {
        status: 'ACTIVE',
      },
    );


    /**
     * Tenant B admin -> ACTIVE
     */
    await this.tenantUserRepository.update(
      {
        userId: tenantBAdmin.id,
        tenantId: tenantB,
      },
      {
        status: 'ACTIVE',
      },
    );


    /**
     * Tenant user -> Tenant A ACTIVE
     */
    await this.tenantUserRepository.update(
      {
        userId: tenantUser.id,
        tenantId: tenantA,
      },
      {
        status: 'ACTIVE',
      },
    );


    /**
     * Tenant user -> Tenant B PENDING
     */
    await this.tenantUserRepository.update(
      {
        userId: tenantUser.id,
        tenantId: tenantB,
      },
      {
        status: 'PENDING',
      },
    );


    /**
     * ----------------------------------------------------------
     * 5. Reset role assignments
     * ----------------------------------------------------------
     *
     * We deliberately rebuild only the test users' role
     * assignments.
     *
     * This guarantees:
     *
     * SUPER_ADMIN
     *   -> system role only
     *
     * Tenant A admin
     *   -> TENANT_ADMIN for Tenant A
     *
     * Tenant B admin
     *   -> TENANT_ADMIN for Tenant B
     *
     * Tenant user
     *   -> no roles
     */
    const testUsers = [
      tenantAAdmin.id,
      tenantBAdmin.id,
      tenantUser.id,
    ];


    await this.userRoleRepository
      .createQueryBuilder()
      .delete()
      .from(UserRoleEntity)
      .where('user_id IN (:...userIds)', {
        userIds: [
          ...testUsers,
          (
            await this.userRepository.findOneOrFail({
              where: {
                email:
                  E2E_AUTH_DATA.users.superAdmin,
              },
            })
          ).id,
        ],
      })
      .execute();


    /**
     * ----------------------------------------------------------
     * 6. Load roles
     * ----------------------------------------------------------
     */
    const superAdminRole =
      await this.roleRepository.findOneOrFail({
        where: {
          slug: 'SUPER_ADMIN',
          isSystem: true,
        },
      });


    const tenantARole =
      await this.roleRepository.findOneOrFail({
        where: {
          slug: 'TENANT_ADMIN',
          tenantId: tenantA,
        },
      });


    const tenantBRole =
      await this.roleRepository.findOneOrFail({
        where: {
          slug: 'TENANT_ADMIN',
          tenantId: tenantB,
        },
      });


    /**
     * ----------------------------------------------------------
     * 7. Load Super Admin
     * ----------------------------------------------------------
     */
    const superAdmin =
      await this.userRepository.findOneOrFail({
        where: {
          email:
            E2E_AUTH_DATA.users.superAdmin,
        },
      });


    /**
     * ----------------------------------------------------------
     * 8. Restore SUPER_ADMIN
     * ----------------------------------------------------------
     *
     * tenant_id MUST remain NULL.
     */
    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        tenantId: null,
      }),
    );


    /**
     * ----------------------------------------------------------
     * 9. Restore Tenant A admin role
     * ----------------------------------------------------------
     */
    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId: tenantAAdmin.id,
        roleId: tenantARole.id,
        tenantId: tenantA,
      }),
    );


    /**
     * ----------------------------------------------------------
     * 10. Restore Tenant B admin role
     * ----------------------------------------------------------
     */
    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId: tenantBAdmin.id,
        roleId: tenantBRole.id,
        tenantId: tenantB,
      }),
    );


    /**
     * ----------------------------------------------------------
     * 11. Tenant user intentionally gets NO role.
     * ----------------------------------------------------------
     *
     * This is required for:
     *
     *   AUTH_ROLE_REQUIRED
     */
  }
}
