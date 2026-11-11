import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddTenantReviewFields1794324768392 implements MigrationInterface {
  name = 'AddTenantReviewFields1794324768392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('tenants', [
      new TableColumn({
        name: 'reviewed_at',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'reviewed_by',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'rejection_reason',
        type: 'varchar',
        length: '1000',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKey(
      'tenants',
      new TableForeignKey({
        name: 'FK_tenants_reviewer',
        columnNames: ['reviewed_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('tenants', 'FK_tenants_reviewer');

    await queryRunner.dropColumns('tenants', [
      'reviewed_at',
      'reviewed_by',
      'rejection_reason',
    ]);
  }
}
