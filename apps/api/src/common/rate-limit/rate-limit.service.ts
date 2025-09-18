import { Injectable } from "@nestjs/common";
import { CacheService } from "../../module/cache/cache.service";

export type RateCheck = {
  allowed: boolean;
  remaining: number;
  resetSec: number;
  count: number;
}

@Injectable()
export class RateLimitService {
  constructor(private readonly cache: CacheService) {}

  async check(key: string, limit: string, windowSec: number): Promise<RateCheck> {
    const count = await (this as any).incr(key);
    let ttl = await (this as any).ttl(key);

    if(count === 1) {
      await (this as any).expire(key, windowSec);
      ttl = windowSec;
    }else if(ttl < 0) {
      await (this as any).expire(key, windowSec);
      ttl = windowSec;
    }
    
    const allowed = count <= +limit;
    const remaining = Math.max(0, +limit - count);
    return { allowed, remaining, resetSec: ttl, count };
  }

  private get client() {
    return (this.cache as any).client ?? (this.cache as any);
  }
  private incr(key: string): Promise<number> { return this.client.incr(key); }
  private ttl(key: string): Promise<number> { return this.client.ttl(key); }
  private expire(key: string, seconds: number): Promise<number> { return this.client.expire(key, seconds); }
  
}