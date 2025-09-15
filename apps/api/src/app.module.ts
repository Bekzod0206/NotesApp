import { ExecutionContext, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './module/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RequestIdMiddleware } from './common/middleware/requestId.middleware';
import { CacheModule } from './module/cache/cache.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './auth/decorators/public.decorator';

class GlobalJwtAuthGuard extends JwtAuthGuard {
  constructor(private reflector: Reflector) { super(); }
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if(isPublic) return true;
    return super.canActivate(context)
  }
}

@Module({
  imports: [UsersModule, NotesModule, PrismaModule, AuthModule, CacheModule, RateLimitModule, HealthModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: GlobalJwtAuthGuard}],
})
export class AppModule implements NotesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
