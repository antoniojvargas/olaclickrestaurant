import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export interface OrdersRepositoryInterface {
  findAllActive(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  create(orderData: Partial<Order>): Promise<Order>;
  createItems(items: Partial<OrderItem>[]): Promise<OrderItem[]>;
  update(order: Order, updates: Partial<Order>): Promise<Order>;
  delete(order: Order): Promise<void>;
}
