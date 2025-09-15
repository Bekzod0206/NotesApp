import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "src/auth/decorators/public.decorator";
import { CacheService } from "src/module/cache/cache.service";
import { PrismaService } from "src/module/prisma/prisma.service";

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  @Public()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return { ok: true, status: 'live' };
  }

  @Public()
  @Get('ready')
  async ready() {
    let db = 'down';
    let redis = 'down';
    const uptimeSec = Math.floor(process.uptime());
    const version = process.env.APP_VERSION ?? 'dev';

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
      ok, db, redis, uptimeSec, version
    }
    if(!ok) throw new ServiceUnavailableException(payload)
    return {
      ...payload,
      status: 200
    }
  }
}