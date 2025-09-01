import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { CacheService } from "src/module/cache/cache.service";
import { PrismaService } from "src/module/prisma/prisma.service";

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return { ok: true, status: 'live' };
  }

  @Get('ready')
  async ready() {
    let db = 'down';
    let redis = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch (_) {
      db = 'down';
    }

    try {
      const pong = await this.cache.ping();
      redis = pong === 'PONG' ? 'up' : 'down';
    } catch (_) {
      redis = 'down';
    }

    const ok = db === 'up' && redis === 'up';
    const payload = {
      ok, db, redis
    }
    return {
      ...payload,
      status: ok ? 200 : 503
    }
  }
}