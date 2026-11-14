
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddAvatarKeyToUsers1800000000002
  implements MigrationInterface
{
  name = 'AddAvatarKeyToUsers1800000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'avatar_key',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'avatar_key');
  }
}
