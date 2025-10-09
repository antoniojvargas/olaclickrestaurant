import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrdersRepositoryInterface } from './orders.repository.interface';

@Injectable()
export class OrdersRepository implements OrdersRepositoryInterface {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
  ) {}

  async findAllActive(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: { status: ['initiated', 'sent'] },
      include: [OrderItem],
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderModel.findByPk(id, { include: [OrderItem] });
  }

  async create(orderData: Partial<Order>): Promise<Order> {
    return this.orderModel.create(orderData as any);
  }

  async createItems(items: Partial<OrderItem>[]): Promise<OrderItem[]> {
    return Promise.all(items.map((item) => this.orderItemModel.create(item as any)));
  }

  async update(order: Order, updates: Partial<Order>): Promise<Order> {
    return order.update(updates);
  }

  async delete(order: Order): Promise<void> {
    await order.destroy();
  }
}
