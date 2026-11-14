
import { Inject, Injectable } from '@nestjs/common';

import { STORAGE_PROVIDER } from './storage.constants';

import type { StorageProvider } from './interfaces/storage-provider.interface';
import type {
  StorageDownloadOptions,
  StorageDownloadResult,
  StorageSignedUrlOptions,
  StorageUploadOptions,
  StorageUploadResult,
} from './storage.interfaces';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider,
  ) {}

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    return this.provider.upload(options);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async getSignedUrl(
    key: string,
    options?: StorageSignedUrlOptions,
  ): Promise<string> {
    return this.provider.getSignedUrl(key, options);
  }

  async download(
    options: StorageDownloadOptions,
  ): Promise<StorageDownloadResult> {
    return this.provider.download(options);
  }
}
