import { Injectable } from '@nestjs/common';
import { PrismaService } from '../module/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  
  async createUser(email: string, password: string) {
    if(!email || !password) {
      throw new Error('Email and password are required');
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = await this.prisma.user.create({
        data: { email, password: hash }
      })
      const { password: _pwd, ...safe } = user;
      return safe;
    } catch (error) {
      if(error.code === 'P2002') {
        throw new Error('User already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

}
