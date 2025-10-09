import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Obtener todas las órdenes no entregadas
  @Get()
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  // Obtener una orden específica
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  // Crear una nueva orden
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  // Avanzar el estado de una orden
  @Post(':id/advance')
  async advanceStatus(
    @Param('id') id: string,
  ): Promise<Order | { message: string }> {
    return this.ordersService.advanceStatus(id);
  }
}
