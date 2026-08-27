import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class InitialAuthSchema1787603702908
  implements MigrationInterface
{
  name = 'InitialAuthSchema1787603702908';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. USERS
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'users',
      new TableUnique({
        name: 'UQ_users_email',
        columnNames: ['email'],
      }),
    );

    // ============================================================
    // 2. TENANTS
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'owner_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'tenants',
      new TableUnique({
        name: 'UQ_tenants_slug',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'tenants',
      new TableIndex({
        name: 'IDX_tenants_owner_id',
        columnNames: ['owner_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'tenants',
      new TableForeignKey({
        name: 'FK_tenants_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD CONSTRAINT "CHK_tenants_status"
      CHECK (
        "status" IN (
          'PENDING',
          'ACTIVE',
          'REJECTED'
        )
      )
    `);

    // ============================================================
    // 3. TENANT USERS
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'tenant_users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    /*
     * A user can belong to a tenant only once.
     *
     * This UNIQUE constraint is also required by the
     * composite FK from user_roles.
     */
    await queryRunner.createUniqueConstraint(
      'tenant_users',
      new TableUnique({
        name: 'UQ_tenant_users_tenant_user',
        columnNames: ['tenant_id', 'user_id'],
      }),
    );

    await queryRunner.createIndex(
      'tenant_users',
      new TableIndex({
        name: 'IDX_tenant_users_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'tenant_users',
      new TableForeignKey({
        name: 'FK_tenant_users_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tenant_users',
      new TableForeignKey({
        name: 'FK_tenant_users_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      ALTER TABLE "tenant_users"
      ADD CONSTRAINT "CHK_tenant_users_status"
      CHECK (
        "status" IN (
          'PENDING',
          'ACTIVE',
          'REJECTED'
        )
      )
    `);

    // ============================================================
    // 4. ROLES
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'roles',
      new TableForeignKey({
        name: 'FK_roles_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    /*
     * SYSTEM ROLE
     *   is_system = TRUE
     *   tenant_id IS NULL
     *
     * TENANT ROLE
     *   is_system = FALSE
     *   tenant_id IS NOT NULL
     */
    await queryRunner.query(`
      ALTER TABLE "roles"
      ADD CONSTRAINT "CHK_roles_system_tenant_consistency"
      CHECK (
        (
          "is_system" = TRUE
          AND "tenant_id" IS NULL
        )
        OR
        (
          "is_system" = FALSE
          AND "tenant_id" IS NOT NULL
        )
      )
    `);

    /*
     * Tenant role slug must be unique inside the tenant.
     *
     * Tenant A -> staff
     * Tenant B -> staff
     *
     * is valid.
     */
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'IDX_roles_tenant_slug_unique',
        columnNames: ['tenant_id', 'slug'],
        isUnique: true,
        where: '"tenant_id" IS NOT NULL',
      }),
    );

    /*
     * System role slug must be globally unique.
     */
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'IDX_roles_system_slug_unique',
        columnNames: ['slug'],
        isUnique: true,
        where: '"is_system" = TRUE',
      }),
    );

    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'IDX_roles_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    /*
     * Required for composite FK:
     *
     * user_roles (
     *   tenant_id,
     *   role_id
     * )
     *
     * -> roles (
     *   tenant_id,
     *   id
     * )
     */
    await queryRunner.createUniqueConstraint(
      'roles',
      new TableUnique({
        name: 'UQ_roles_tenant_id_id',
        columnNames: ['tenant_id', 'id'],
      }),
    );

    // ============================================================
    // 5. PERMISSIONS
    // ============================================================

    /*
     * Permissions are GLOBAL.
     *
     * They do not belong to a tenant.
     */
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'permissions',
      new TableUnique({
        name: 'UQ_permissions_slug',
        columnNames: ['slug'],
      }),
    );

    // ============================================================
    // 6. USER ROLES
    // ============================================================

    /*
     * tenant_id is the security context.
     *
     * SYSTEM ROLE:
     *   tenant_id = NULL
     *
     * TENANT ROLE:
     *   tenant_id = tenant UUID
     */
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    /*
     * Base role FK.
     *
     * This guarantees that role_id always references
     * an existing role.
     */
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_role',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    /*
     * Tenant membership FK.
     *
     * For tenant-scoped assignments:
     *
     * user_roles (
     *   tenant_id,
     *   user_id
     * )
     *
     * must exist in tenant_users.
     */
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_tenant_user',
        columnNames: ['tenant_id', 'user_id'],
        referencedTableName: 'tenant_users',
        referencedColumnNames: ['tenant_id', 'user_id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    /*
     * Tenant role FK.
     *
     * This prevents:
     *
     * Tenant A role -> Tenant B assignment.
     */
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_tenant_role',
        columnNames: ['tenant_id', 'role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['tenant_id', 'id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // ============================================================
    // 7. USER ROLE VALIDATION
    // ============================================================

    /*
     * Composite FKs alone cannot completely express the distinction
     * between system and tenant roles because tenant_id is nullable.
     *
     * Therefore the final security rule is enforced by a trigger.
     */
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_user_role_assignment()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        role_tenant_id uuid;
        role_is_system boolean;
        membership_status varchar(20);
      BEGIN

        /*
         * Load role information.
         */
        SELECT
          r.tenant_id,
          r.is_system
        INTO
          role_tenant_id,
          role_is_system
        FROM roles r
        WHERE r.id = NEW.role_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION
            'Role % does not exist',
            NEW.role_id;
        END IF;

        /*
         * SYSTEM ROLE
         *
         * System roles must never have tenant context.
         */
        IF role_is_system = TRUE THEN

          IF NEW.tenant_id IS NOT NULL THEN
            RAISE EXCEPTION
              'System role % cannot have a tenant context',
              NEW.role_id;
          END IF;

          RETURN NEW;
        END IF;

        /*
         * TENANT ROLE
         *
         * Tenant roles must have a tenant context.
         */
        IF NEW.tenant_id IS NULL THEN
          RAISE EXCEPTION
            'Tenant role % requires a tenant_id',
            NEW.role_id;
        END IF;

        /*
         * Role must belong to the same tenant.
         */
        IF role_tenant_id IS DISTINCT FROM NEW.tenant_id THEN
          RAISE EXCEPTION
            'Role % does not belong to tenant %',
            NEW.role_id,
            NEW.tenant_id;
        END IF;

        /*
         * User must have a membership in that tenant.
         */
        SELECT
          tu.status
        INTO
          membership_status
        FROM tenant_users tu
        WHERE
          tu.tenant_id = NEW.tenant_id
          AND tu.user_id = NEW.user_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION
            'User % is not a member of tenant %',
            NEW.user_id,
            NEW.tenant_id;
        END IF;

        /*
         * Only ACTIVE members can receive tenant roles.
         */
        IF membership_status <> 'ACTIVE' THEN
          RAISE EXCEPTION
            'User % does not have an ACTIVE membership in tenant %',
            NEW.user_id,
            NEW.tenant_id;
        END IF;

        RETURN NEW;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE TRIGGER "TRG_validate_user_role_assignment"
      BEFORE INSERT OR UPDATE
      ON "user_roles"
      FOR EACH ROW
      EXECUTE FUNCTION validate_user_role_assignment();
    `);

    // ============================================================
    // 8. USER ROLE UNIQUENESS
    // ============================================================

    /*
     * Tenant role:
     *
     * User A + Tenant X + STAFF
     * User A + Tenant X + STAFF  -> forbidden
     *
     * But:
     *
     * User A + Tenant X + STAFF
     * User A + Tenant Y + STAFF  -> valid
     */
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_tenant_user_role_unique',
        columnNames: ['tenant_id', 'user_id', 'role_id'],
        isUnique: true,
        where: '"tenant_id" IS NOT NULL',
      }),
    );

    /*
     * System role:
     *
     * User A + SUPER_ADMIN
     * User A + SUPER_ADMIN -> forbidden
     */
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_system_user_role_unique',
        columnNames: ['user_id', 'role_id'],
        isUnique: true,
        where: '"tenant_id" IS NULL',
      }),
    );

    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_role_id',
        columnNames: ['role_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    // ============================================================
    // 9. ROLE PERMISSIONS
    // ============================================================

    /*
     * Role <-> Permission relation.
     *
     * Permissions are global.
     * Roles may be system or tenant scoped.
     */
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'permission_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'FK_role_permissions_role',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'FK_role_permissions_permission',
        columnNames: ['permission_id'],
        referencedTableName: 'permissions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    /*
     * A role can have a permission only once.
     */
    await queryRunner.createUniqueConstraint(
      'role_permissions',
      new TableUnique({
        name: 'UQ_role_permissions_role_permission',
        columnNames: ['role_id', 'permission_id'],
      }),
    );

    /*
     * Explicit permission lookup index.
     *
     * The UNIQUE constraint above already provides an index
     * starting with role_id, so a separate role_id index is
     * intentionally not created.
     */
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'IDX_role_permissions_permission_id',
        columnNames: ['permission_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // DROP IN REVERSE DEPENDENCY ORDER
    // ============================================================

    /*
     * user_roles owns a trigger and depends on:
     * users
     * roles
     * tenant_users
     */
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS
      "TRG_validate_user_role_assignment"
      ON "user_roles";
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS
      validate_user_role_assignment();
    `);

    /*
     * role_permissions depends on:
     * roles
     * permissions
     */
    await queryRunner.dropTable(
      'role_permissions',
      true,
    );

    /*
     * user_roles depends on:
     * users
     * roles
     * tenant_users
     */
    await queryRunner.dropTable(
      'user_roles',
      true,
    );

    /*
     * permissions has no dependents now.
     */
    await queryRunner.dropTable(
      'permissions',
      true,
    );

    /*
     * roles depends on tenants.
     */
    await queryRunner.dropTable(
      'roles',
      true,
    );

    /*
     * tenant_users depends on:
     * tenants
     * users
     */
    await queryRunner.dropTable(
      'tenant_users',
      true,
    );

    /*
     * tenants depends on users.
     */
    await queryRunner.dropTable(
      'tenants',
      true,
    );

    /*
     * users is the root table.
     */
    await queryRunner.dropTable(
      'users',
      true,
    );
  }
}