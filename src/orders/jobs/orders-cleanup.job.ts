import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { OrdersRepositoryInterface } from '../repositories/orders.repository.interface';
import { ORDERS_REPOSITORY } from '../repositories/orders.repository.interface';

@Injectable()
export class OrdersCleanupJob {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: OrdersRepositoryInterface,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  // 🕐 Se ejecuta cada día a medianoche
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOldOrdersCleanup(): Promise<void> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 7); // elimina órdenes >7 días

    this.logger.log('🧹 Iniciando limpieza de órdenes antiguas...', {
      job: OrdersCleanupJob.name,
      thresholdDate: thresholdDate.toISOString(),
      timestamp: new Date().toISOString(),
    });

    try {
      const deletedCount = await this.ordersRepository.deleteOlderThan(thresholdDate);

      this.logger.log(`✅ Limpieza completada. Órdenes eliminadas: ${deletedCount}`, {
        job: OrdersCleanupJob.name,
        deletedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('❌ Error durante la limpieza de órdenes antiguas', {
        job: OrdersCleanupJob.name,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
