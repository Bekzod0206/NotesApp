import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../module/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  
  async createUser(email: string, password: string) {
    if(!email || !password) {
      throw new Error('Email and password are required');
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if(existing) {
      throw new ConflictException({
        message: 'User already exists',
        code: 'USER_EXISTS'
      })
    }
    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    const hash = await bcrypt.hash(password, saltRounds);
    try {
      const user = await this.prisma.user.create({
        data: { email, password: hash },
        select: { id: true, email: true, createdAt: true, updatedAt: true }
      });
      return user;
    } catch (error) {
      if(error.code === 'P2002') {
        throw new ConflictException({
          message: 'User already exists',
          code: 'USER_EXISTS'
        })
      }
      throw error;
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

}
