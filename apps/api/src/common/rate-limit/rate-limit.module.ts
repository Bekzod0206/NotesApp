import { Global, Module } from "@nestjs/common";
import { RateLimitService } from "./rate-limit.service";
import { IpAuthRateGuard } from "./guards/ip-auth-rate.guard";
import { UserWriteRateGuard } from "./guards/user-write-rate.guard";

@Global()
@Module({
  providers: [RateLimitService, IpAuthRateGuard, UserWriteRateGuard],
  exports: [RateLimitService, IpAuthRateGuard, UserWriteRateGuard]
})
export class RateLimitModule {}