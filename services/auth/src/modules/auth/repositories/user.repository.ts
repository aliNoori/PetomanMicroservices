import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  // ============================================================
  // FIND BY EMAIL
  // ============================================================

  async findByEmail(
    email: string,
  ): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: {
        email,
      },
    });
  }

  // ============================================================
  // FIND ACTIVE USER BY EMAIL
  // ============================================================

  async findActiveByEmail(
    email: string,
  ): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: {
        email,
        isActive: true,
      },
    });
  }

  // ============================================================
  // FIND BY ID
  // ============================================================

  async findById(
    id: string,
  ): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  // ============================================================
  // FIND ACTIVE USER BY ID
  // ============================================================

  async findActiveById(
    id: string,
  ): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: {
        id,
        isActive: true,
      },
    });
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    data: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const user = this.repository.create(data);

    return this.repository.save(user);
  }

  // ============================================================
  // SAVE
  // ============================================================

  async save(
    user: UserEntity,
  ): Promise<UserEntity> {
    return this.repository.save(user);
  }
}
