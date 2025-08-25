import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/module/prisma/prisma.service';
import { ListNotesQueryDto, SortOrder } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async createNote(title: string, content: string | null, userId: number) {
    if(!title) throw new BadRequestException("Title is required");
    return this.prisma.note.create({data: { title, content, userId: Number(userId) }});
  }

  async getAllNotes(
    userId: number,
    { limit = 10, cursor, sort = 'desc' as SortOrder }: ListNotesQueryDto
  ){
    const take = Math.min(Math.max(limit, 1), 50) + 1;
    const where = { userId };
    const orderBy = { createdAt: sort };

    const notes = await this.prisma.note.findMany({
      where,
      orderBy,
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      // where: { userId: Number(userId) }, orderBy: {createdAt: 'desc'}
    });

    let nextCursor: number | undefined;
    if(notes.length === take) {
      const nextItem = notes.pop()!;
      nextCursor = nextItem.id;
    }
    return { notes, nextCursor };
  }

  async updateNote(id: number, userId: number, title: string | null, content: string | null) {
    const {count} = await this.prisma.note.updateMany({
      where: { id: Number(id) },
      data: { ...(title !== null && {title}), ...(content !== null && {content}) }
    });
    if(count === 0) throw new NotFoundException(`Note with id ${id} not found`);
    return this.prisma.note.findFirst({ where: { id: Number(id), userId: Number(userId) } });
  }

  async deleteNote(id: number, userId: number) {
    const deletedNotes = await this.prisma.note.deleteMany({ where: { id: Number(id), userId: Number(userId) }})
    if(deletedNotes.count === 0) throw new NotFoundException(`Note with id ${id} not found`);
    return { success: true }
  }
}
