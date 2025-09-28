import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/module/prisma/prisma.service';

describe('E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.note.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    await prisma.$disconnect();
    await app.close();
  });

  it('auth + notes happy path', async () => {
    const email = 'e2e@test.com', password = 'secret123';

    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ email, password })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const token = login.body.accessToken;

    await request(app.getHttpServer())
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'A', content: 'B' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/notes?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

      const body = list.body;
      expect(Array.isArray(body.data || body.notes)).toBe(true);
  });
});
