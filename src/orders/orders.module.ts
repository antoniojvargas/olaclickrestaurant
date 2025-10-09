import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [SequelizeModule.forFeature([Order, OrderItem])],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: 'OrdersRepositoryInterface',
      useClass: OrdersRepository,
    },
  ],
  exports: ['OrdersRepositoryInterface'],
})
export class OrdersModule {}
