
import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

import { StorageService } from '@petoman/infrastructure';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 20_000_000;
const AVATAR_SIZE = 512;

const ALLOWED_IMAGE_FORMATS = ['jpeg', 'png', 'webp'] as const;

interface AvatarUploadFile {
  readonly buffer: Buffer;
  readonly size: number;
}

@Injectable()
export class UserAvatarService {
  private readonly logger = new Logger(UserAvatarService.name);

  constructor(
    private readonly storageService: StorageService,
  ) {}

  async uploadAvatar(
  userId: string,
  file: AvatarUploadFile,
): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Avatar file is required.');
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException('Avatar file exceeds the 5 MB limit.');
    }

    let imageBuffer: Buffer;

    try {
      const image = sharp(file.buffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: 'error',
      });

      const metadata = await image.metadata();

      if (
        !metadata.format ||
        !ALLOWED_IMAGE_FORMATS.includes(
          metadata.format as (typeof ALLOWED_IMAGE_FORMATS)[number],
        )
      ) {
        throw new BadRequestException(
          'Only JPEG, PNG, and WebP images are allowed.',
        );
      }

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Invalid image dimensions.');
      }

      imageBuffer = await sharp(file.buffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: 'error',
      })
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.warn('Avatar image validation or processing failed.');

      throw new BadRequestException('Invalid or unsupported avatar image.');
    }

    const key = `users/${userId}/avatar/${randomUUID()}.webp`;

    const result = await this.storageService.upload({
      key,
      body: imageBuffer,
      contentType: 'image/webp',
      cacheControl: 'private, max-age=300',
    });

    return result.key;
  }

  async deleteAvatar(key: string | null | undefined): Promise<void> {
    if (!key) {
      return;
    }

    await this.storageService.delete(key);
  }

  async getAvatarUrl(
    key: string | null | undefined,
  ): Promise<string | null> {
    if (!key) {
      return null;
    }

    return this.storageService.getSignedUrl(key);
  }
}
