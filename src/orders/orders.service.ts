import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import type { Cache } from 'cache-manager';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(): Promise<Order[]> {
    const cacheKey = 'orders_not_delivered';
    const cachedOrders = await this.cacheManager.get<Order[]>(cacheKey);

    if (cachedOrders) {
      console.log('✅ Retornando ordenes desde el cache');
      return cachedOrders;
    }

    const orders = await this.orderModel.findAll({
      where: { status: ['initiated', 'sent'] },
      include: [OrderItem],
    });

    await this.cacheManager.set(cacheKey, orders, 30 * 1000);

    console.log('💾 Ordenes en el cache por 30 segundos');
    return orders;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findByPk(id, { include: [OrderItem] });
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await this.orderModel.create({
      clientName: dto.clientName,
      totalAmount,
      status: 'initiated',
    });

    await Promise.all(
      dto.items.map((item) =>
        this.orderItemModel.create({
          ...item,
          orderId: order.id,
        }),
      ),
    );

    await this.cacheManager.del('orders_not_delivered');

    return this.findOne(order.id);
  }

  async advanceStatus(id: string): Promise<Order | { message: string }> {
    const order = await this.findOne(id);

    const nextStatusMap: Record<
      'initiated' | 'sent' | 'delivered',
      'sent' | 'delivered' | null
    > = {
      initiated: 'sent',
      sent: 'delivered',
      delivered: null,
    };

    const nextStatus = nextStatusMap[order.status];

    if (!nextStatus) {
      await order.destroy();
      await this.cacheManager.del(`order_${id}`);
      return { message: `Order ${id} has been delivered and removed.` };
    }

    await order.update({ status: nextStatus });
    await this.cacheManager.del('orders_not_delivered');
    return order;
  }
}
