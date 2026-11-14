import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalStorageProvider } from "./local-storage.provider";
import type { LocalStorageOptions } from "../storage.interfaces";

describe("LocalStorageProvider", () => {
  let rootDirectory: string;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    rootDirectory = await mkdtemp(join(tmpdir(), "petoman-storage-"));

    const options: LocalStorageOptions = {
      rootDirectory,
      publicBaseUrl: "http://localhost:3000",
      signingSecret: "test-storage-secret-at-least-32-characters",
      region: "local",
      bucket: "test-bucket",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      forcePathStyle: true,
      signedUrlExpiresInSeconds: 300,
    };

    provider = new LocalStorageProvider(options);
  });

  afterEach(async () => {
    await rm(rootDirectory, { recursive: true, force: true });
  });

  it("should upload and download a file using a valid signed URL", async () => {
    const key = "avatars/test-user/avatar.webp";
    const content = Buffer.from("test-avatar-content");

    await provider.upload({
      key,
      body: content,
      contentType: "image/webp",
    });

    const signedUrl = await provider.getSignedUrl(key);
    const url = new URL(signedUrl);

    const result = await provider.download({
      key: url.searchParams.get("key")!,
      expiresAt: Number(url.searchParams.get("expires")),
      signature: url.searchParams.get("signature")!,
    });

    expect(result.body).toEqual(content);
    expect(result.contentLength).toBe(content.length);
    expect(result.contentType).toBe("image/webp");
  });

  it("should reject a download request with a tampered signature", async () => {
    const key = "avatars/test-user/avatar.webp";

    const signedUrl = await provider.getSignedUrl(key);
    const url = new URL(signedUrl);

    const signature = url.searchParams.get("signature")!;

    const tamperedSignature =
      (signature[0] === "0" ? "1" : "0") + signature.slice(1);

    await expect(
      provider.download({
        key,
        expiresAt: Number(url.searchParams.get("expires")),
        signature: tamperedSignature,
      }),
    ).rejects.toThrow("Invalid or expired storage signature.");
  });

  it("should reject an expired signed URL", async () => {
    const key = "avatars/test-user/avatar.webp";

    const signedUrl = await provider.getSignedUrl(key, {
      expiresInSeconds: -1,
    });

    const url = new URL(signedUrl);

    await expect(
      provider.download({
        key,
        expiresAt: Number(url.searchParams.get("expires")),
        signature: url.searchParams.get("signature")!,
      }),
    ).rejects.toThrow("Invalid or expired storage signature.");
  });

  it("should delete the uploaded file and its metadata", async () => {
    const key = "avatars/test-user/avatar.webp";

    await provider.upload({
      key,
      body: Buffer.from("test-avatar-content"),
      contentType: "image/webp",
    });

    await provider.delete(key);

    const signedUrl = await provider.getSignedUrl(key);
    const url = new URL(signedUrl);

    await expect(
      provider.download({
        key,
        expiresAt: Number(url.searchParams.get("expires")),
        signature: url.searchParams.get("signature")!,
      }),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("should reject storage keys containing path traversal segments", async () => {
    await expect(
      provider.upload({
        key: "../secret.txt",
        body: Buffer.from("unauthorized"),
        contentType: "text/plain",
      }),
    ).rejects.toThrow("Invalid storage key.");
  });
});
