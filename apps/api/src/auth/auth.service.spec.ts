import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../module/prisma/prisma.service';
import { CacheService } from '../module/cache/cache.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => 'hashed'),
  genSalt: jest.fn(async () => 'salt'),
}));

describe('AuthService', () => {
  let service: AuthService;
  const users = { createUser: jest.fn(), findByEmail: jest.fn(), findById: jest.fn() };
  const jwt = { signAsync: jest.fn(() => 'access.jwt.token') };
  const prisma = { refreshToken: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() }} as any;
  const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() } as any;

  const ipAuthGuardStub = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
      ]
    }).compile();
    service = mod.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('signUp returns tokens + user', async () => {
    users.createUser.mockResolvedValue({ id: 1, email: "u@test.com" });
    prisma.refreshToken.create.mockResolvedValue({});
    const res = await service.signUp('u@test.com', 'pwd');
    expect(res.user.id).toBe(1);
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
  });

  it('logIn fails with invalid creds', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.logIn('x@test.com', 'pwd')).rejects.toBeDefined();
  });
});
