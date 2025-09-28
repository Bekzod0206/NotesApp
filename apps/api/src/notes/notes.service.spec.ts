import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../module/prisma/prisma.service';
import { CacheService } from '../module/cache/cache.service';

describe('NotesService', () => {
  let service: NotesService;

  const prisma = {
    note: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirstOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  } as any;

  const cache: Partial<CacheService> = {
    get: jest.fn(async () => null),
    set: jest.fn(async () => undefined),
    del: jest.fn(async () => undefined),
  };


  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();
    service = mod.get<NotesService>(NotesService);
  });

  it('scopes list by userId', async () => {
    prisma.note.findMany.mockResolvedValue([]);
    await service.getAllNotes(123, { page: 1, limit: 10, sort: 'createdAt:desc' } as any);
    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 123 } }),
    );
  });
});
