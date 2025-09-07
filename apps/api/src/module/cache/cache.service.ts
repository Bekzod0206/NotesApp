import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";


@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    const url = process.env.REDIS_URL;
    this.client = url ? new Redis(url) : new Redis();
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

  async delByPrefix(pattern: string): Promise<number> {
    const stream = this.client.scanStream({ match: `${pattern}*`, count: 100});
    const toDel: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        if(keys.length) toDel.push(...keys);
      });
      stream.on('end', () => resolve);
      stream.on('error', () => reject);
    });

    if(toDel.length) await this.client.del(...toDel);
    return toDel.length;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}