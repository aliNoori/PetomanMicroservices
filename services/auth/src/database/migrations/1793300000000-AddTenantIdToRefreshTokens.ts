import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToRefreshTokens1793300000000
  implements MigrationInterface
{
  name = 'AddTenantIdToRefreshTokens1793300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD COLUMN "tenant_id" uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "FK_refresh_tokens_tenant_id"
      FOREIGN KEY ("tenant_id")
      REFERENCES "tenants"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_tenant_id"
      ON "refresh_tokens" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_refresh_tokens_tenant_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP CONSTRAINT "FK_refresh_tokens_tenant_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP COLUMN "tenant_id"
    `);
  }
}