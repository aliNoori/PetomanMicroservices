import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddEmailVerificationToUsers1793891222240
  implements MigrationInterface
{
  name = 'AddEmailVerificationToUsers1793891222240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'is_email_verified',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
      new TableColumn({
        name: 'email_verified_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'users',
      'email_verified_at',
    );

    await queryRunner.dropColumn(
      'users',
      'is_email_verified',
    );
  }
}