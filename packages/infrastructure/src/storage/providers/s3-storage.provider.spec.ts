
import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { StorageOptions } from '../storage.interfaces';
import { S3StorageProvider } from './s3-storage.provider';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const s3Mock = mockClient(S3Client);

const storageOptions: StorageOptions = {
  region: 'us-east-1',
  bucket: 'test-bucket',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  forcePathStyle: true,
  signedUrlExpiresInSeconds: 300,
};

describe('S3StorageProvider', () => {
  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
  });

  afterAll(() => {
    s3Mock.restore();
  });

  it('should upload a file and return its key and ETag', async () => {
    s3Mock.on(PutObjectCommand).resolves({
      ETag: '"etag-123"',
    });

    const provider = new S3StorageProvider(storageOptions);

    const result = await provider.upload({
      key: 'avatars/user-123.webp',
      body: Buffer.from('test-image'),
      contentType: 'image/webp',
      cacheControl: 'private, max-age=3600',
      metadata: {
        owner: 'user-123',
      },
    });

    expect(result).toEqual({
      key: 'avatars/user-123.webp',
      etag: '"etag-123"',
    });

    const calls = s3Mock.commandCalls(PutObjectCommand);

    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input).toMatchObject({
      Bucket: 'test-bucket',
      Key: 'avatars/user-123.webp',
      ContentType: 'image/webp',
      CacheControl: 'private, max-age=3600',
      Metadata: {
        owner: 'user-123',
      },
    });

    expect(calls[0].args[0].input.Body).toEqual(
      Buffer.from('test-image'),
    );

    provider.onApplicationShutdown();
  });

  it('should delete a file from S3', async () => {
    s3Mock.on(DeleteObjectCommand).resolves({});

    const provider = new S3StorageProvider(storageOptions);

    await expect(
      provider.delete('avatars/user-123.webp'),
    ).resolves.toBeUndefined();

    const calls = s3Mock.commandCalls(DeleteObjectCommand);

    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input).toEqual({
      Bucket: 'test-bucket',
      Key: 'avatars/user-123.webp',
    });

    provider.onApplicationShutdown();
  });

  it('should generate a signed download URL', async () => {
    const expectedUrl = 'https://storage.example.com/signed-file';

    jest.mocked(getSignedUrl).mockResolvedValue(expectedUrl);

    const provider = new S3StorageProvider(storageOptions);

    const result = await provider.getSignedUrl(
      'avatars/user-123.webp',
    );

    expect(result).toBe(expectedUrl);
    expect(getSignedUrl).toHaveBeenCalledTimes(1);

    const [client, command, options] = jest.mocked(getSignedUrl).mock.calls[0];

    expect(client).toBeInstanceOf(S3Client);
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'avatars/user-123.webp',
    });
    expect(options).toEqual({
      expiresIn: 300,
    });

    provider.onApplicationShutdown();
  });

  it('should use a custom signed URL expiration time', async () => {
    jest.mocked(getSignedUrl).mockResolvedValue(
      'https://storage.example.com/custom-expiration',
    );

    const provider = new S3StorageProvider(storageOptions);

    await provider.getSignedUrl('documents/file.pdf', {
      expiresInSeconds: 600,
    });

    expect(jest.mocked(getSignedUrl).mock.calls[0][2]).toEqual({
      expiresIn: 600,
    });

    provider.onApplicationShutdown();
  });

  it('should not support downloading files through the Gateway', async () => {
    const provider = new S3StorageProvider(storageOptions);

    await expect(
      provider.download({
        key: 'avatars/user-123.webp',
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        signature: 'test-signature',
      }),
    ).rejects.toThrow(
      'Gateway downloads are not supported for S3 storage. Use a signed URL instead.',
    );

    provider.onApplicationShutdown();
  });
});
