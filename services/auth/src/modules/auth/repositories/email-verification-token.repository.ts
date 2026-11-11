
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  Repository,
} from 'typeorm';

import { EmailVerificationTokenEntity } from '../entities/email-verification-token.entity';

@Injectable()
export class EmailVerificationTokenRepository {
  constructor(
    @InjectRepository(EmailVerificationTokenEntity)
    private readonly repository: Repository<EmailVerificationTokenEntity>,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    data: Partial<EmailVerificationTokenEntity>,
    manager?: EntityManager,
  ): Promise<EmailVerificationTokenEntity> {
    const repository = this.getRepository(manager);

    const token = repository.create(data);

    return repository.save(token);
  }

  // ============================================================
  // FIND BY TOKEN HASH
  // ============================================================

  async findByHash(
    tokenHash: string,
    manager?: EntityManager,
  ): Promise<EmailVerificationTokenEntity | null> {
    return this.getRepository(manager).findOne({
      where: {
        tokenHash,
      },
    });
  }

  // ============================================================
  // FIND VALID TOKEN
  // ============================================================

  async findValidToken(
    tokenHash: string,
    manager?: EntityManager,
    lock = false,
  ): Promise<EmailVerificationTokenEntity | null> {
    const repository = this.getRepository(manager);

    const query = repository
      .createQueryBuilder('token')
      .where('token.token_hash = :tokenHash', { tokenHash })
      .andWhere('token.used_at IS NULL')
      .andWhere('token.expires_at > CURRENT_TIMESTAMP');

    if (lock) {
      if (!manager) {
        throw new Error(
          'Pessimistic locking requires a transaction EntityManager.',
        );
      }

      query.setLock('pessimistic_write');
    }

    return query.getOne();
  }

  // ============================================================
  // INVALIDATE UNUSED TOKENS
  // ============================================================

  async invalidateUnusedByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.getRepository(manager)
      .createQueryBuilder()
      .update(EmailVerificationTokenEntity)
      .set({
        usedAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('user_id = :userId', { userId })
      .andWhere('used_at IS NULL')
      .execute();
  }

  // ============================================================
  // MARK AS USED
  // ============================================================

  async markAsUsed(
    tokenId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.getRepository(manager)
      .createQueryBuilder()
      .update(EmailVerificationTokenEntity)
      .set({
        usedAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('id = :tokenId', { tokenId })
      .andWhere('used_at IS NULL')
      .andWhere('expires_at > CURRENT_TIMESTAMP')
      .execute();

    return result.affected === 1;
  }

  // ============================================================
  // SAVE
  // ============================================================

  async save(
    token: EmailVerificationTokenEntity,
    manager?: EntityManager,
  ): Promise<EmailVerificationTokenEntity> {
    return this.getRepository(manager).save(token);
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private getRepository(
    manager?: EntityManager,
  ): Repository<EmailVerificationTokenEntity> {
    return manager
      ? manager.getRepository(EmailVerificationTokenEntity)
      : this.repository;
  }
}
