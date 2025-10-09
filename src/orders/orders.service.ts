// src/orders/orders.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { OrdersRepositoryInterface } from './repositories/orders.repository.interface';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { CACHE_KEYS } from './constants/cache-keys';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: OrdersRepositoryInterface,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findAll(): Promise<Order[]> {
    const cacheKey = CACHE_KEYS.ORDERS_NOT_DELIVERED;
    const cached = await this.cacheManager.get<Order[]>(cacheKey);

    if (cached) {
      console.log('✅ Retornando órdenes desde el caché');
      return cached;
    }

    const orders = await this.ordersRepository.findAllActive();
    await this.cacheManager.set(cacheKey, orders, 30 * 1000);
    console.log('💾 Órdenes cacheadas por 30 segundos');
    return orders;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await this.ordersRepository.create({
      clientName: dto.clientName,
      totalAmount,
      status: 'initiated',
    });

    await this.ordersRepository.createItems(
      dto.items.map((item) => ({ ...item, orderId: order.id })),
    );

    await this.cacheManager.del(CACHE_KEYS.ORDERS_NOT_DELIVERED);
    return this.findOne(order.id);
  }

  async advanceStatus(id: string): Promise<Order | { message: string }> {
    const order = await this.findOne(id);

    const nextStatusMap = {
      initiated: 'sent',
      sent: 'delivered',
      delivered: null,
    } as const;

    const nextStatus = nextStatusMap[order.status];

    if (nextStatus === 'delivered' || !nextStatus) {
      await this.ordersRepository.delete(order);
      await this.cacheManager.del(CACHE_KEYS.ORDERS_NOT_DELIVERED);
      console.log(`🗑️ Orden ${id} entregada y eliminada del sistema`);
      return { message: `Order ${id} has been delivered and removed.` };
    }

    await this.ordersRepository.update(order, { status: nextStatus });
    await this.cacheManager.del(CACHE_KEYS.ORDERS_NOT_DELIVERED);
    console.log(`🔄 Orden ${id} avanzó a estado: ${nextStatus}`);
    return order;
  }
}
