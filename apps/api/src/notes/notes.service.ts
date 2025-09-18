import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../module/prisma/prisma.service';
import { CacheService } from '../module/cache/cache.service';
import { ListNotesQueryDto, SortOrder, UpdateNoteDto } from './dto/note.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  private userNotesPrefix(userId: number) {
    return `u:${userId}:notes:`;
  }

  private listCacheKey (userId: number,  params: { sort: SortOrder; query?: string; limit: number; cursor?: number }) {
    const base = this.userNotesPrefix(userId);
    const q = params.query ? encodeURIComponent(params.query) : '';
    const cur = params.cursor ?? '';
    return `${base}list:sort=${params.sort}:q=${q}:c=${cur}:l=${params.limit}`;
  }

  async createNote(title: string, content: string | null, userId: number) {
    if(!title) throw new BadRequestException("Title is required");

    const created = await this.prisma.note.create({data: { title, content, userId: Number(userId) }});

    await this.cache.delByPrefix(this.userNotesPrefix(userId));
    await this.cache.del(`u:${userId}:note:${created.id}`);

    return created;
  }

  async getAllNotes(
    userId: number,
    { limit = 10, cursor, sort = 'desc' as SortOrder, query }: ListNotesQueryDto
  ){

    const take = Math.min(Math.max(limit, 1), 50) + 1;
    const where: Prisma.NoteWhereInput = { userId, 
      ...(query ? {
        OR: [
          {title: { contains: query, mode: 'insensitive' }},
          {content: { contains: query, mode: 'insensitive' }}
        ]
      } : {}),
    };

    const orderBy: Prisma.NoteOrderByWithRelationInput[] = [
      { createdAt: sort },
      { id: sort }
    ]

    const cacheKey = this.listCacheKey(userId, { sort, query, limit, cursor });
    const cached = await this.cache.get<{ notes: any[]; nextCursor?: number }>(cacheKey)
    if(cached) return { ...cached, fromCache: true };

    const notes = await this.prisma.note.findMany({
      where,
      orderBy,
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, title: true, content: true, createdAt: true, updatedAt: true},
    });

    let nextCursor: number | undefined;
    if(notes.length === take) {
      const nextItem = notes.pop()!;
      nextCursor = nextItem.id;
    }

    await this.cache.set(cacheKey, { notes, nextCursor }, 60);
    return { notes, nextCursor };
  }

  async getNoteById(id: number, userId: number) {
    const key = `u:${userId}:note:${id}`;

    const cached = await this.cache.get<any>(key);
    if(cached) return { ...cached, fromCache: true };

    const note = await this.prisma.note.findFirst({ where: { id, userId }});
    if(!note) {
      throw new NotFoundException({
        message: `Note with id ${id} not found`,
        code: 'NOTE_NOT_FOUND'
      })
    }

    await this.cache.set(key, note, 120);
    return note;
  }

  async updateNote(id: number, userId: number, dto: UpdateNoteDto) {
    const note = await this.prisma.note.findFirst({ where: { id, userId }})
    if(!note) {
      throw new NotFoundException({
        message: `Note with id ${id} not found`,
        code: 'NOTE_NOT_FOUND'
      })
    }
    const updated = await this.prisma.note.update({
      where: { id },
      data: { ...dto }
    })

    await this.cache.delByPrefix(this.userNotesPrefix(userId));
    await this.cache.del(`u:${userId}:note:${id}`);
    return updated;
  }

  async deleteNote(id: number, userId: number) {
    const deletedNotes = await this.prisma.note.deleteMany({ where: { id: Number(id), userId: Number(userId) }})
    if(deletedNotes.count === 0) {
      throw new NotFoundException({
        message: `Note with id ${id} not found`,
        code: 'NOTE_NOT_FOUND'
      });
    }

    await this.cache.del(`u:${userId}:note:${id}`);
    await this.cache.delByPrefix(this.userNotesPrefix(userId));
    return { success: true };
  }
}
