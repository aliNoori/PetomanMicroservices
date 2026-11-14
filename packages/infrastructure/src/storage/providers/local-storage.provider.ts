import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type {
  LocalStorageOptions,
  StorageDownloadOptions,
  StorageDownloadResult,
  StorageSignedUrlOptions,
  StorageUploadOptions,
  StorageUploadResult,
} from "../storage.interfaces";
import type { StorageProvider } from "../interfaces/storage-provider.interface";

export class LocalStorageProvider implements StorageProvider {
  private readonly rootDirectory: string;

  constructor(private readonly options: LocalStorageOptions) {
    this.rootDirectory = resolve(options.rootDirectory);
  }

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    const filePath = this.resolvePath(options.key);
    const metadataPath = this.getMetadataPath(options.key);

    await mkdir(dirname(filePath), { recursive: true });
    await mkdir(dirname(metadataPath), { recursive: true });

    await writeFile(filePath, options.body, { flag: "w" });

    await writeFile(
      metadataPath,
      JSON.stringify({
        contentType: options.contentType,
      }),
      "utf8",
    );

    return { key: options.key };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    const metadataPath = this.getMetadataPath(key);

    const results = await Promise.allSettled([
      unlink(filePath),
      unlink(metadataPath),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        const error = result.reason as NodeJS.ErrnoException;

        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }
  }

  async download(
    options: StorageDownloadOptions,
  ): Promise<StorageDownloadResult> {
    if (
      !this.verifySignature(options.key, options.expiresAt, options.signature)
    ) {
      throw new Error("Invalid or expired storage signature.");
    }

    const filePath = this.resolvePath(options.key);
    const metadataPath = this.getMetadataPath(options.key);

    const body = await readFile(filePath);

    let contentType: string | undefined;

    try {
      const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as {
        contentType?: unknown;
      };

      if (typeof metadata.contentType === "string") {
        contentType = metadata.contentType;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    return {
      body,
      contentLength: body.length,
      contentType,
    };
  }

  async getSignedUrl(
    key: string,
    options?: StorageSignedUrlOptions,
  ): Promise<string> {
    const expiresAt =
      Math.floor(Date.now() / 1000) +
      (options?.expiresInSeconds ?? this.options.signedUrlExpiresInSeconds);

    const signature = this.createSignature(key, expiresAt);

    const url = new URL("/api/storage", this.options.publicBaseUrl);

    url.searchParams.set("key", key);

    url.searchParams.set("expires", String(expiresAt));
    url.searchParams.set("signature", signature);

    return url.toString();
  }

  private resolvePath(key: string): string {
    if (!key || key.includes("\0")) {
      throw new Error("Invalid storage key.");
    }

    const normalizedKey = key.replace(/\\/g, "/");

    if (
      normalizedKey.startsWith("/") ||
      normalizedKey.split("/").some((segment) => segment === "..")
    ) {
      throw new Error("Invalid storage key.");
    }

    const filePath = resolve(this.rootDirectory, normalizedKey);

    if (
      filePath !== this.rootDirectory &&
      !filePath.startsWith(`${this.rootDirectory}${sep}`)
    ) {
      throw new Error("Storage key resolves outside the storage directory.");
    }

    return filePath;
  }

  private createSignature(key: string, expiresAt: number): string {
    return createHmac("sha256", this.options.signingSecret)
      .update(`${key}:${expiresAt}`)
      .digest("hex");
  }

  private verifySignature(
    key: string,
    expiresAt: number,
    signature: string,
  ): boolean {
    if (
      !Number.isSafeInteger(expiresAt) ||
      expiresAt <= Math.floor(Date.now() / 1000) ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return false;
    }

    const expectedSignature = this.createSignature(key, expiresAt);

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const actualBuffer = Buffer.from(signature, "hex");

    return (
      expectedBuffer.length === actualBuffer.length &&
      timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }

  private getMetadataPath(key: string): string {
    const hash = createHash("sha256").update(key).digest("hex");

    return resolve(this.rootDirectory, ".metadata", `${hash}.json`);
  }
}
