import type {
  StorageDownloadOptions,
  StorageDownloadResult,
  StorageSignedUrlOptions,
  StorageUploadOptions,
  StorageUploadResult,
} from '../storage.interfaces';

export interface StorageProvider {
  upload(
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult>;

  delete(key: string): Promise<void>;

  getSignedUrl(
    key: string,
    options?: StorageSignedUrlOptions,
  ): Promise<string>;

  download(
    options: StorageDownloadOptions,
  ): Promise<StorageDownloadResult>;
}