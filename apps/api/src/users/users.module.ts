import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../module/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule to use PrismaService
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
