import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, ListNotesQueryDto, UpdateNoteDto } from './dto/note.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserWriteRateGuard } from '../common/rate-limit/guards/user-write-rate.guard';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('notes')
@ApiBearerAuth('BearerAuth')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @ApiCreatedResponse({ description: 'Note created' })
  @UseGuards(UserWriteRateGuard)
  @Post()
  create(@Body() dto: CreateNoteDto, @CurrentUser() user: { sub: number, email: string }){
    return this.notesService.createNote(dto.title, dto.content ?? null, user.sub);
  }

  @ApiOkResponse({ description: 'Notes list with pagination' })
  @Get()
  findAll(
    @CurrentUser() user: { sub: number, email: string },
    @Query() query: ListNotesQueryDto
  ){
    return this.notesService.getAllNotes(user.sub, query);
  }

  @ApiOkResponse({ description: 'Single note' })
  @Get(':id')
  findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: { sub: number }) {
    return this.notesService.getNoteById(id, user.sub);
  }

  @ApiOkResponse({ description: 'Note updated' })
  @UseGuards(UserWriteRateGuard)
  @Patch(':id')
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateNoteDto, @CurrentUser() user: { sub: number, email: string }){
    return this.notesService.updateNote(id, user.sub, dto);
  }

  @ApiNoContentResponse({ description: 'Note deleted' })
  @UseGuards(UserWriteRateGuard)
  @Delete(':id')
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: { sub: number }) {
    return this.notesService.deleteNote(id, user.sub);
  }
}
