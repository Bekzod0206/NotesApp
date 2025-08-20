import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule, JwtModule.register({
    secret: process.env.JWT_SECRET || 'defaultsecret',
    signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  })],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
