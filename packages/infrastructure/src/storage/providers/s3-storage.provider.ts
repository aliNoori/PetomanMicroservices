import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { OnApplicationShutdown } from "@nestjs/common";

import type {
  StorageDownloadOptions,
  StorageDownloadResult,
  StorageOptions,
  StorageSignedUrlOptions,
  StorageUploadOptions,
  StorageUploadResult,
} from "../storage.interfaces";

import type { StorageProvider } from "../interfaces/storage-provider.interface";

export class S3StorageProvider
  implements StorageProvider, OnApplicationShutdown
{
  private readonly client: S3Client;

  constructor(private readonly options: StorageOptions) {
    const clientConfig: S3ClientConfig = {
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      forcePathStyle: options.forcePathStyle,
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
    };

    this.client = new S3Client(clientConfig);
  }

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    const result = await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
        Metadata: options.metadata ? { ...options.metadata } : undefined,
      }),
    );

    return {
      key: options.key,
      etag: result.ETag,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
      }),
    );
  }

  async download(
    _options: StorageDownloadOptions,
  ): Promise<StorageDownloadResult> {
    throw new Error(
      "Gateway downloads are not supported for S3 storage. Use a signed URL instead.",
    );
  }

  async getSignedUrl(
    key: string,
    options?: StorageSignedUrlOptions,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.options.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn:
        options?.expiresInSeconds ?? this.options.signedUrlExpiresInSeconds,
    });
  }

  onApplicationShutdown(): void {
    this.client.destroy();
  }
}
