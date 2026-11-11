import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddDeviceInfoToRefreshTokens1800000000000
  implements MigrationInterface
{
  name = 'AddDeviceInfoToRefreshTokens1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('refresh_tokens', [
      new TableColumn({
        name: 'device',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'operating_system',
        type: 'varchar',
        length: '150',
        isNullable: true,
      }),
      new TableColumn({
        name: 'browser',
        type: 'varchar',
        length: '150',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('refresh_tokens', [
      'device',
      'operating_system',
      'browser',
    ]);
  }
}