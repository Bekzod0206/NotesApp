import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(); // Enable graceful shutdown
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
