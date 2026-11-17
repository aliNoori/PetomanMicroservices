import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddTenantTypeToTenants1800000000003
  implements MigrationInterface
{
  name = 'AddTenantTypeToTenants1800000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        length: '20',
        default: "'markets'",
        isNullable: false,
      }),
    );

    await queryRunner.query(`
      UPDATE tenants
      SET type = CASE id::text
        WHEN '6004fe84-ea94-4c74-b3cd-30682c234e37' THEN 'vets'
        WHEN 'fd6751f7-c8f6-4575-b211-18e2ef43180e' THEN 'pharmacies'
        WHEN '6c568037-76b8-4735-8318-7cd8b053b755' THEN 'markets'
        WHEN '89786e09-5624-4272-b2f8-0a2584d4ad82' THEN 'vets'
        WHEN 'e2934821-049e-4c48-8dfd-543230aa1995' THEN 'markets'
        WHEN '576b9ba5-b61a-4741-a260-38d81893e004' THEN 'pharmacies'
        WHEN 'eaa209b8-17c5-4029-b640-bb4f99f62d36' THEN 'markets'
        WHEN 'e43d2fa2-2115-4610-9ab5-0941b3a864ac' THEN 'vets'
        WHEN '13daaeca-ceb7-4382-975f-3adf8b1bb3d7' THEN 'pharmacies'
        WHEN '167d3ce8-8d0f-4c79-a28c-4cffa76217b5' THEN 'markets'
        ELSE 'markets'
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tenants', 'type');
  }
}
