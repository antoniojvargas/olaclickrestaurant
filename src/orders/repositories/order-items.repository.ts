import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  OrderItem,
  OrderItemCreationAttributes,
} from '../entities/order-item.entity';

@Injectable()
export class OrderItemsRepository {
  constructor(
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
  ) {}

  async create(itemData: OrderItemCreationAttributes) {
    return this.orderItemModel.create(itemData);
  }

  async findByOrder(orderId: string) {
    return this.orderItemModel.findAll({ where: { orderId } });
  }
}
