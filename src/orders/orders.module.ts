import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersCleanupJob } from './jobs/orders-cleanup.job';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, OrderItem]),
    ScheduleModule.forRoot(),
    WinstonModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersCleanupJob,
    {
      provide: ORDERS_REPOSITORY,
      useClass: OrdersRepository,
    },
  ],
  exports: [ORDERS_REPOSITORY],
})
export class OrdersModule {}
