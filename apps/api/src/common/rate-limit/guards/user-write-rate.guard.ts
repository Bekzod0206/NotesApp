import { CanActivate, ExecutionContext, Injectable, Req, RequestTimeoutException, UnauthorizedException } from "@nestjs/common";
import { RateLimitService } from "../rate-limit.service";

@Injectable()
export class UserWriteRateGuard implements CanActivate {
  constructor( private readonly rl: RateLimitService ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { sub: number } | undefined;
    if(!user?.sub) {
      throw new UnauthorizedException({
        message: "Missin user in request (JWT required before rate limit check)",
        code: "UNATHORIZED"
      })
    }

    const key = `rl:user-write:${user.sub}:writes`;
    const limit = +(process.env.RATE_LIMIT_USER_WRITE_LIMIT ?? 30);
    const windowSec = +(process.env.RATE_LIMIT_USER_WRITE_WINDOW_SEC ?? 60);

    const { allowed, remaining, resetSec,count } = await this.rl.check(key, limit.toString(), windowSec);
    if(!allowed) {
      throw new RequestTimeoutException({
        error: "Too many requests",
        message: "Rate limit exceeded on write endpoints. Try again, later",
        code: "RATE_LIMIT_EXCEEDED",
        meta: { scope: "user-writes", limit, remaining, resetSec, count, userId: user.sub }
      })
    }

    return true;
  }
}