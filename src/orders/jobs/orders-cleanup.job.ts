import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { OrdersRepositoryInterface } from '../repositories/orders.repository.interface';
import { ORDERS_REPOSITORY } from '../repositories/orders.repository.interface';

@Injectable()
// Marca la clase como inyectable para que NestJS la pueda instanciar
export class OrdersCleanupJob {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: OrdersRepositoryInterface,
    // Inyecta el repositorio de órdenes usando el token ORDERS_REPOSITORY

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    // Inyecta el logger de Winston
  ) {}

  // 🕐 Método programado para ejecutarse cada día a medianoche
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOldOrdersCleanup(): Promise<void> {
    // Calcula la fecha límite para eliminar órdenes antiguas (más de 7 días)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 7);

    // Log inicial indicando que la limpieza ha comenzado
    this.logger.log('🧹 Iniciando limpieza de órdenes antiguas...', {
      job: OrdersCleanupJob.name,
      thresholdDate: thresholdDate.toISOString(),
      timestamp: new Date().toISOString(),
    });

    try {
      // Llama al repositorio para eliminar órdenes anteriores a la fecha límite
      const deletedCount =
        await this.ordersRepository.deleteOlderThan(thresholdDate);

      // Log de éxito indicando cuántas órdenes se eliminaron
      this.logger.log(
        `✅ Limpieza completada. Órdenes eliminadas: ${deletedCount}`,
        {
          job: OrdersCleanupJob.name,
          deletedCount,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error: unknown) {
      // Manejo de errores
      if (error instanceof Error) {
        // Si es un error estándar, se logea su mensaje y stack
        this.logger.error('❌ Error durante la limpieza de órdenes antiguas', {
          job: OrdersCleanupJob.name,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Si es un error desconocido, se logea tal cual
        this.logger.error(
          '❌ Error desconocido durante la limpieza de órdenes antiguas',
          {
            job: OrdersCleanupJob.name,
            error,
            timestamp: new Date().toISOString(),
          },
        );
      }
    }
  }
}
