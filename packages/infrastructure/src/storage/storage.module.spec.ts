import { describe, expect, it } from "@jest/globals";
import type { FactoryProvider } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { STORAGE_PROVIDER } from "./storage.constants";
import { StorageModule } from "./storage.module";
import type { StorageModuleOptions } from "./storage.interfaces";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import { S3StorageProvider } from "./providers/s3-storage.provider";

const localOptions: StorageModuleOptions = {
  driver: "local",
  region: "local",
  bucket: "test-bucket",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  forcePathStyle: true,
  signedUrlExpiresInSeconds: 300,
  rootDirectory: "./storage-test",
  publicBaseUrl: "http://localhost:3000",
  signingSecret: "test-signing-secret-at-least-32-characters",
};

const s3Options: StorageModuleOptions = {
  driver: "s3",
  region: "us-east-1",
  bucket: "test-bucket",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  forcePathStyle: true,
  signedUrlExpiresInSeconds: 300,
};

describe("StorageModule", () => {
  const createProvider = (options: StorageModuleOptions) => {
    const dynamicModule = StorageModule.forRootAsync({
      useFactory: () => options,
    });

    const provider = dynamicModule.providers?.find(
      (item) => (item as FactoryProvider).provide === STORAGE_PROVIDER,
    ) as FactoryProvider;

    const factory = provider.useFactory as (
      storageOptions: StorageModuleOptions,
    ) => LocalStorageProvider | S3StorageProvider;

    return factory(options);
  };

  it("should create LocalStorageProvider when driver is local", () => {
    const provider = createProvider(localOptions);

    expect(provider).toBeInstanceOf(LocalStorageProvider);
  });

  it("should create S3StorageProvider when driver is s3", () => {
    const provider = createProvider(s3Options);

    expect(provider).toBeInstanceOf(S3StorageProvider);

    if (provider instanceof S3StorageProvider) {
      provider.onApplicationShutdown();
    }
  });

  it("should export StorageService", () => {
    const dynamicModule = StorageModule.forRootAsync({
      useFactory: () => localOptions,
    });

    expect(dynamicModule.exports).toContain(StorageService);
  });
});
