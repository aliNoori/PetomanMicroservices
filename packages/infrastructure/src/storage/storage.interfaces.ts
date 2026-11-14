export interface StorageUploadOptions {
  readonly key: string;
  readonly body: Uint8Array;
  readonly contentType: string;
  readonly cacheControl?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface StorageUploadResult {
  readonly key: string;
  readonly etag?: string;
}

export interface StorageDownloadResult {
  readonly body: Buffer;
  readonly contentType?: string;
  readonly contentLength: number;
}

export interface StorageSignedUrlOptions {
  readonly expiresInSeconds?: number;
}

export interface StorageOptions {
  readonly endpoint?: string;
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly forcePathStyle: boolean;
  readonly signedUrlExpiresInSeconds: number;
}

export interface LocalStorageOptions extends StorageOptions {
  readonly rootDirectory: string;
  readonly publicBaseUrl: string;
  readonly signingSecret: string;
}

export type StorageModuleOptions =
  | (StorageOptions & {
      readonly driver: "s3";
    })
  | (LocalStorageOptions & {
      readonly driver: "local";
    });

export interface StorageDownloadOptions {
  readonly key: string;
  readonly expiresAt: number;
  readonly signature: string;
}
