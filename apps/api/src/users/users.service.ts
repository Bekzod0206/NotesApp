import { Injectable } from '@nestjs/common';
import { PrismaService } from '../module/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      include: {notes: true},
    });
  }
}
