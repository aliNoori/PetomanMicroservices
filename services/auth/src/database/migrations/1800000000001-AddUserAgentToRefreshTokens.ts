import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddUserAgentToRefreshTokens1800000000001
  implements MigrationInterface
{
  name = 'AddUserAgentToRefreshTokens1800000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'refresh_tokens',
      new TableColumn({
        name: 'user_agent',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('refresh_tokens', 'user_agent');
  }
}