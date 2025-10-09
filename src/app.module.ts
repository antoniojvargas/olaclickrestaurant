import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { OrdersModule } from './orders/orders.module';
import { setTimeout } from 'timers/promises';
import IORedis from 'ioredis';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

/**
 * Función auxiliar que espera hasta que Redis esté listo
 * @param host - Host de Redis
 * @param port - Puerto de Redis
 * @param retries - Número de intentos antes de fallar
 */
async function waitForRedis(host: string, port: number, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new IORedis({ host, port });
      await client.ping(); // Comprobar si Redis responde
      client.disconnect();
      console.log('✅ Redis está listo');
      return;
    } catch {
      console.log(`Redis no listo, reintentando (${i + 1}/${retries})...`);
      await setTimeout(1000); // Esperar 1 segundo antes de reintentar
    }
  }
  throw new Error('❌ No se pudo conectar a Redis');
}

@Module({
  imports: [
    // ✅ Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),

    // ✅ Habilitar soporte para cron jobs
    ScheduleModule.forRoot(),

    // ✅ Configuración global del logger Winston
    WinstonModule.forRoot(winstonConfig),

    // ✅ Configuración de Sequelize (ORM)
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';

        // Si estamos en modo test, usar SQLite en memoria
        return isTest
          ? {
              dialect: 'sqlite',
              storage: ':memory:',
              autoLoadModels: true,
              synchronize: true,
              logging: false,
            }
          : {
              dialect: 'postgres',
              host: config.get<string>('DB_HOST'),
              port: config.get<number>('DB_PORT'),
              username: config.get<string>('DB_USER'),
              password: config.get<string>('DB_PASS'),
              database: config.get<string>('DB_NAME'),
              autoLoadModels: true,
              synchronize: true,
            };
      },
    }),

    // ✅ Configuración del Cache
    ...(process.env.NODE_ENV === 'test'
      ? [
          // Cache en memoria para tests
          CacheModule.register({
            isGlobal: true,
            store: 'memory',
            ttl: 5, // Tiempo de vida 5 segundos
          }),
        ]
      : [
          // Cache con Redis para otros entornos
          CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
              const host = configService.get<string>('REDIS_HOST') || 'redis';
              const port = parseInt(
                configService.get<string>('REDIS_PORT') || '6379',
                10,
              );
              const ttl = parseInt(
                configService.get<string>('CACHE_TTL') || '30',
                10,
              );

              console.log(`🚀 Conectando a Redis en ${host}:${port}`);

              // Esperar hasta que Redis esté listo
              await waitForRedis(host, port);

              const store = await redisStore({ host, port });

              return { store, ttl };
            },
          }),
        ]),

    // Módulo de órdenes
    OrdersModule,
  ],
  controllers: [AppController], // Controladores de la aplicación
  providers: [
    AppService, // Servicio principal
    AllExceptionsFilter, // Filtro global de excepciones
    LoggingInterceptor, // Interceptor para logs
    TransformResponseInterceptor, // Interceptor para transformar respuestas
    ErrorInterceptor, // Interceptor para errores
  ],
})
export class AppModule {}
