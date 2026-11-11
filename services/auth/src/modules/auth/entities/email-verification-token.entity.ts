import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('email_verification_tokens')
@Index(
  'IDX_email_verification_tokens_user_id',
  ['userId'],
)
@Index(
  'IDX_email_verification_tokens_expires_at',
  ['expiresAt'],
)
export class EmailVerificationTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 64,
    unique: true,
  })
  tokenHash!: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'used_at',
    type: 'timestamptz',
    nullable: true,
  })
  usedAt!: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  // ============================================================
  // User Relationship
  // ============================================================

  @ManyToOne(
    () => UserEntity,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user!: UserEntity;
}