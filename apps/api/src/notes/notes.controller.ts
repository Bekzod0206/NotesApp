import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, ListNotesQueryDto, UpdateNoteDto } from './dto/note.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}


  @Post()
  create(@Body() dto: CreateNoteDto, @CurrentUser() user: { sub: number, email: string }){
    return this.notesService.createNote(dto.title, dto.content ?? null, user.sub);
  }

  @Get()
  findAll(
    @CurrentUser() user: { sub: number, email: string },
    @Query() query: ListNotesQueryDto
  ){
    return this.notesService.getAllNotes(user.sub, query);
  }

  @Patch(':id')
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateNoteDto, @CurrentUser() user: { sub: number, email: string }){
    return this.notesService.updateNote(id, user.sub, dto);
  }

  @Delete(':id')
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: { sub: number }) {
    return this.notesService.deleteNote(id, user.sub);
  }
}
