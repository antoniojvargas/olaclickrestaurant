import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SanitizeInputPipe } from './common/pipes/sanitize-input.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // 🧠 Seguridad HTTP
  app.use(helmet());
  app.useGlobalPipes(new SanitizeInputPipe());
  app.use(
    rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 100, // máximo 100 peticiones por IP
    }),
  );

  // 1️⃣ Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // ❌ Rechaza propiedades no definidas en el DTO
      forbidNonWhitelisted: true,
      transform: true,           // Transforma payloads a instancias de clase DTO
      transformOptions: {
        enableImplicitConversion: true,
      },
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

  // 3️⃣ Filtro global (también obtenido del contenedor)
  const allExceptionsFilter = app.get(AllExceptionsFilter);
  app.useGlobalFilters(allExceptionsFilter);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
