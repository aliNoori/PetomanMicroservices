
import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  readonly driver: 'local' | 's3';
  readonly endpoint?: string;
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly forcePathStyle: boolean;
  readonly signedUrlExpiresInSeconds: number;
  readonly localRootDirectory: string;
  readonly localPublicBaseUrl: string;
  readonly localSigningSecret: string;
}

export default registerAs(
  'storage',
  (): StorageConfig => ({
    driver: process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local',

    endpoint: process.env.STORAGE_ENDPOINT || undefined,

    region: process.env.STORAGE_REGION ?? 'us-east-1',

    bucket: process.env.STORAGE_BUCKET ?? 'petoman-private',

    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? '',

    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',

    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== 'false',

    signedUrlExpiresInSeconds: Number(
      process.env.STORAGE_SIGNED_URL_EXPIRES_IN_SECONDS ?? 300,
    ),

    localRootDirectory:
      process.env.STORAGE_LOCAL_ROOT_DIRECTORY ?? './storage',

    localPublicBaseUrl:
      process.env.STORAGE_LOCAL_PUBLIC_BASE_URL ?? 'http://localhost:3000',

    localSigningSecret: process.env.STORAGE_LOCAL_SIGNING_SECRET ?? '',
  }),
);
