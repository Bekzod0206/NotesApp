import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/httpException.filter';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function parseOrigins(raw?: string): (string | RegExp)[] | boolean {
  if(!raw) return false;
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : false
}

function enableSwagger(app: any) {
  const isProd = process.env.NODE_EV === 'production';
  const allowedInProd = process.env.SWAGGER_ENABLED === 'true'
  if(isProd && !allowedInProd) return;

  const config = new DocumentBuilder()
    .setTitle('NotesApp API')
    .setDescription('NestJS + Prisma + Postgres')
    .setVersion(process.env.APP_VERSION || 'dev')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'BearerAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  })
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(); // Enable graceful shutdown
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet())
  app.enableCors({
    origin: parseOrigins(process.env.CORS_ORIGINS),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
  });

  // Swagger setup
  enableSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
