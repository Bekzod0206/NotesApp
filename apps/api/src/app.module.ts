import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './module/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RequestIdMiddleware } from './common/middleware/requestId.middleware';
import { CacheModule } from './module/cache/cache.module';

@Module({
  imports: [UsersModule, NotesModule, PrismaModule, AuthModule, CacheModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NotesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
