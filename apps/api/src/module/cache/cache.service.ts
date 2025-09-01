import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";


@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    this.client = new Redis(url);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) as T : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(keys: string | string[]): Promise<void> {
    if(Array.isArray(keys)) {
      if(keys.length) await this.client.del(...keys);
    }else{
      await this.client.del(keys);
    }
  }

  async delByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if(!keys.length) return 0;
    await this.client.del(...keys);
    return keys.length;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}