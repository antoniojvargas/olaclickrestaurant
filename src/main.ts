import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // 1️⃣ Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 2️⃣ Interceptores globales
  const loggingInterceptor = app.get(LoggingInterceptor);
  const transformInterceptor = app.get(TransformResponseInterceptor);
  const errorInterceptor = app.get(ErrorInterceptor);

  app.useGlobalInterceptors(
    loggingInterceptor,
    transformInterceptor,
    errorInterceptor,
  );

  await app.listen(3000);
}
void bootstrap();
