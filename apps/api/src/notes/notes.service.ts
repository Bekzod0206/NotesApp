import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/module/prisma/prisma.service';
import { CacheService } from 'src/module/cache/cache.service';
import { ListNotesQueryDto, SortOrder, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  async createNote(title: string, content: string | null, userId: number) {
    if(!title) throw new BadRequestException("Title is required");

    const created = await this.prisma.note.create({data: { title, content, userId: Number(userId) }});

    await this.cache.delByPattern(`u:${userId}:notes:list*`);
    await this.cache.del(`u:${userId}:notes:${created.id}`);

    return created;
  }

  async getAllNotes(
    userId: number,
    { limit = 10, cursor, sort = 'desc' as SortOrder }: ListNotesQueryDto
  ){

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const key = `u:${userId}:notes:list:sort=${sort}:cursor=${cursor || 'null'}:limit=${safeLimit}`;
    
    // Try to get from cache
    const cached = await this.cache.get<{ notes: any[], nextCursor?: number }>(key);
    if(cached) {
      return {...cached, fromCache: true};
    }

    const take = safeLimit + 1;
    const where = { userId };
    const orderBy = { createdAt: sort };

    const notes = await this.prisma.note.findMany({
      where,
      orderBy,
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: number | undefined;
    if(notes.length === take) {
      const nextItem = notes.pop()!;
      nextCursor = nextItem.id;
    }

    const payload = { notes, nextCursor };
    
    // Store in cache for 60 seconds
    await this.cache.set(key, payload, 60);

    return payload;
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
    const updated = this.prisma.note.update({
      where: { id },
      data: { ...dto }
    })

    await this.cache.del([
      `u:${userId}:notes:${id}`,
    ])
    await this.cache.delByPattern(`u:${userId}:notes:list*`);

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

    await this.cache.del([
      `u:${userId}:notes:${id}`,
    ])
    await this.cache.delByPattern(`u:${userId}:notes:list*`);
    
    return { success: true }
  }
}
