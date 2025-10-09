import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { OrdersRepositoryInterface } from '../repositories/orders.repository.interface';
import { ORDERS_REPOSITORY } from '../repositories/orders.repository.interface';

@Injectable()
export class OrdersCleanupJob {
  private readonly logger = new Logger(OrdersCleanupJob.name);

  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: OrdersRepositoryInterface,
  ) {}

  // 🕐 Se ejecuta cada día a medianoche
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOldOrdersCleanup(): Promise<void> {
    this.logger.log('🧹 Iniciando limpieza de órdenes antiguas...');

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 7); // ejemplo: más de 7 días

    const deletedCount = await this.ordersRepository.deleteOlderThan(thresholdDate);

    this.logger.log(`✅ Limpieza completada. Órdenes eliminadas: ${deletedCount}`);
  }
}
