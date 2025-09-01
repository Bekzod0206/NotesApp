import { CanActivate, ExecutionContext, Injectable, RequestTimeoutException } from "@nestjs/common";
import { RateLimitService } from "../rate-limit.service";

@Injectable()
export class IpAuthRateGuard implements CanActivate {
  constructor(private readonly rl: RateLimitService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown').toString();
    const key = `rl:ip-auth:${ip}`;
    const limit = +(process.env.RATE_LIMIT_AUTH_IP_LIMIT ?? 10);
    const windowSec = +(process.env.RATE_LIMIT_AUTH_IP_WINDOW_SEC ?? 60);

    const { allowed, remaining, resetSec,count } = await this.rl.check(key, limit.toString(), windowSec);
    if(!allowed) {
      throw new RequestTimeoutException({
        error: "Too many requests",
        message: "Rate limit exceeded on auth endpoint. Try again, later",
        code: "RATE_LIMIT_EXCEEDED",
        meta: { scope: "auth-ip", limit, remaining, resetSec, count, ip }
      });
    }
    return true;
  }

}