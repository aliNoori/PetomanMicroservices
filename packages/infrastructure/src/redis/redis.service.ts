import { Inject, Injectable } from "@nestjs/common";

import type Redis from "ioredis";

import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new Error("TTL must be a positive integer.");
      }

      await this.redis.set(key, value, "EX", ttlSeconds);
      return;
    }

    await this.redis.set(key, value);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) > 0;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async ping(): Promise<boolean> {
    return (await this.redis.ping()) === "PONG";
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    this.validateTtl(ttlSeconds);

    const result = await this.redis.set(key, value, "EX", ttlSeconds, "NX");

    return result === "OK";
  }

  async deleteIfValue(key: string, expectedValue: string): Promise<boolean> {
    const script = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('DEL', KEYS[1])
    end

    return 0
  `;

    const result = await this.redis.eval(script, 1, key, expectedValue);

    return result === 1;
  }

  async replaceIfValue(
    key: string,
    expectedValue: string,
    newValue: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    this.validateTtl(ttlSeconds);

    const script = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
      return 1
    end

    return 0
  `;

    const result = await this.redis.eval(
      script,
      1,
      key,
      expectedValue,
      newValue,
      String(ttlSeconds),
    );

    return result === 1;
  }

  private validateTtl(ttlSeconds: number): void {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error("TTL must be a positive integer.");
    }
  }
}
