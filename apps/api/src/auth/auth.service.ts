import { JwtPayload } from './strategies/jwt.strategy';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/module/prisma/prisma.service';
import { randomToken, refreshExpiry, sha256 } from './utils/token.util';


@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private prisma: PrismaService
  ) {}

  // helpers
  private async signAccessToken(user: { id: number, email: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
  }

  private async mintRefreshToken(userId: number) {
    const refreshToken = randomToken();
    const tokenHash = sha256(refreshToken);
    const expiresAt = refreshExpiry();

    await this.prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt },
    });

    return { refreshToken, expiresAt };
  }

  private async rotateRefreshToken(oldToken: string) {
    const oldTokenHash = sha256(oldToken);
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: oldTokenHash } });
    if(!row) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      })
    }
    if(row.expiresAt <= new Date()) {
      await this.prisma.refreshToken.delete({ where: { tokenHash: oldTokenHash } });
      throw new UnauthorizedException({
        code: 'EXPIRED_REFRESH_TOKEN',
        message: 'Refresh token has expired'
      })
    }

    await this.prisma.refreshToken.delete({ where: { tokenHash: oldTokenHash } });
    const { refreshToken, expiresAt } = await this.mintRefreshToken(row.userId);
    return { refreshToken, expiresAt, userId: row.userId };
  }


  // main methods
  async signUp (email: string, password: string) {
    const user = await this.users.createUser(email, password);
    const accessToken = await this.signAccessToken(user);
    const { refreshToken, expiresAt } = await this.mintRefreshToken(user.id);
    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt.toISOString()
    }
  }

  async logIn(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if(!user) {
      throw new UnauthorizedException({
        message: 'Invalid Email or Password',
        code: 'INVALID_CREDENTIALS'
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid Email or Password',
        code: 'INVALID_CREDENTIALS'
      })
    }

    const accessToken = await this.signAccessToken(user);
    const { refreshToken, expiresAt } = await this.mintRefreshToken(user.id);
    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt.toISOString()
    }
  }

  async refresh(refreshToken: string) {
    if(!refreshToken) {
      throw new UnauthorizedException({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'No refresh token provided'
      })
    }
    const rotated = await this.rotateRefreshToken(refreshToken);
    const user = await this.users.findById(rotated.userId);
    if(!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const accessToken = await this.signAccessToken(user);
    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      refreshTokenExpiresAt: rotated.expiresAt.toISOString()
    }
  }

  async logout(refreshToken: string) {
    if(!refreshToken) {
      throw new UnauthorizedException({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'No refresh token provided'
      })
    }

    const hash = sha256(refreshToken);
    await this.prisma.refreshToken.delete({ where: { tokenHash: hash } }).catch(() => {});
    return { success: true };
  }

  async logoutAll(userId: number) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { success: true };
  }

}
