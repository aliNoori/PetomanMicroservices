import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';
import { InternalJwtGuard } from '@petoman/security';

import { StorageService } from '@petoman/infrastructure';
import { StorageDownloadQueryDto } from './dtos/storage-download-query.dto';

@UseGuards(InternalJwtGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  async download(
    @Query() query: StorageDownloadQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const result = await this.storageService.download({
        key: query.key,
        expiresAt: query.expires,
        signature: query.signature,
      });

      response.setHeader(
        'Content-Type',
        result.contentType ?? 'application/octet-stream',
      );

      response.setHeader('Content-Length', result.contentLength);
      response.setHeader('Cache-Control', 'private, no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');

      response.status(200).send(result.body);
    } catch (error) {
      console.error('[Storage Download Error]', error);
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException({
          code: 'STORAGE_FILE_NOT_FOUND',
          message: 'The requested file was not found.',
        });
      }

      if (
        error instanceof Error &&
        error.message === 'Invalid or expired storage signature.'
      ) {
        throw new BadRequestException({
          code: 'STORAGE_INVALID_SIGNATURE',
          message: 'The storage link is invalid or has expired.',
        });
      }

      throw new ServiceUnavailableException({
        code: 'STORAGE_DOWNLOAD_FAILED',
        message: 'Unable to retrieve the requested file.',
      });
    }
  }
}