import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order, OrderCreationAttributes } from '../entities/order.entity';
import {
  OrderItem,
  OrderItemCreationAttributes,
} from '../entities/order-item.entity';
import type { OrdersRepositoryInterface } from './orders.repository.interface';
import { Op } from 'sequelize';

@Injectable()
// Marca la clase como inyectable para que pueda ser usada en otros servicios o controladores
export class OrdersRepository implements OrdersRepositoryInterface {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    // Inyecta el modelo Sequelize de Order
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
    // Inyecta el modelo Sequelize de OrderItem
  ) {}

  // Retorna todas las órdenes activas (estado 'initiated' o 'sent') e incluye sus items
  async findAllActive(): Promise<Order[]> {
    return this.orderModel.findAll({
      where: { status: ['initiated', 'sent'] },
      include: [OrderItem],
    });
  }

  // Busca una orden por su ID e incluye sus items
  async findById(id: string): Promise<Order | null> {
    return this.orderModel.findByPk(id, { include: [OrderItem] });
  }

  // Crea una nueva orden en la base de datos
  async create(orderData: OrderCreationAttributes): Promise<Order> {
    return this.orderModel.create(orderData);
  }

  // Crea múltiples items asociados a una orden
  async createItems(
    items: OrderItemCreationAttributes[],
  ): Promise<OrderItem[]> {
    return Promise.all(items.map((item) => this.orderItemModel.create(item)));
  }

  // Actualiza una orden con los campos especificados
  async update(order: Order, updates: Partial<Order>): Promise<Order> {
    return order.update(updates);
  }

  // Elimina una orden de la base de datos
  async delete(order: Order): Promise<void> {
    await order.destroy();
  }

  // Elimina todas las órdenes creadas antes de una fecha específica
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.orderModel.destroy({
      where: {
        createdAt: { [Op.lt]: date }, // Op.lt = "menor que"
      },
    });
    return result; // Retorna el número de órdenes eliminadas
  }
}
