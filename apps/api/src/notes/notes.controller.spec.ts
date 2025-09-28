import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { UserWriteRateGuard } from '../common/rate-limit/guards/user-write-rate.guard';
import { NotesService } from './notes.service';


describe('NotesController', () => {
  let controller: NotesController;

  const notesServiceMock = {
    createNote: jest.fn(),
    getAllNotes: jest.fn(),
    getNoteById: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: notesServiceMock }],
    }).overrideGuard(UserWriteRateGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotesController>(NotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
