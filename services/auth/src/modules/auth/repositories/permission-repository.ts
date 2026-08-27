import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repository: Repository<PermissionEntity>,
  ) {}

  // ============================================================
  // FIND BY ID
  // ============================================================

  async findById(
    id: string,
  ): Promise<PermissionEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  // ============================================================
  // FIND BY SLUG
  // ============================================================

  async findBySlug(
    slug: string,
  ): Promise<PermissionEntity | null> {
    return this.repository.findOne({
      where: {
        slug,
      },
    });
  }

  // ============================================================
  // FIND BY IDS
  // ============================================================

  async findByIds(
    ids: string[],
  ): Promise<PermissionEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('permission')
      .where('permission.id IN (:...ids)', { ids })
      .orderBy('permission.slug', 'ASC')
      .getMany();
  }

  // ============================================================
  // FIND BY SLUGS
  // ============================================================

  async findBySlugs(
    slugs: string[],
  ): Promise<PermissionEntity[]> {
    if (slugs.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('permission')
      .where('permission.slug IN (:...slugs)', { slugs })
      .orderBy('permission.slug', 'ASC')
      .getMany();
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(): Promise<PermissionEntity[]> {
    return this.repository.find({
      order: {
        slug: 'ASC',
      },
    });
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    data: Pick<
      PermissionEntity,
      'slug' | 'name' | 'description'
    >,
  ): Promise<PermissionEntity> {
    const permission =
      this.repository.create(data);

    return this.repository.save(permission);
  }

  // ============================================================
  // SAVE
  // ============================================================

  async save(
    permission: PermissionEntity,
  ): Promise<PermissionEntity> {
    return this.repository.save(permission);
  }
}
