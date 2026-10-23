import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';
import { requestContextMiddleware } from './request-context.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));
  app.setGlobalPrefix('api/v1');

  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  app.enableCors(corsOrigin ? { origin: corsOrigin } : undefined);

  app.use(requestContextMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}

bootstrap();
