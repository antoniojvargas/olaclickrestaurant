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
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiOperation
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

@ApiTags('orders')
// Etiqueta el controlador para Swagger con el grupo 'orders'
@Controller('orders')
// Define la ruta base del controlador: /orders
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  // Inyecta el servicio de órdenes

  // 📋 Listar todas las órdenes
  @Get()
  @ApiOperation({ summary: 'Listar todas las órdenes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes existentes',
    schema: {
      example: [
        {
          id: 1,
          clientName: 'Ana López',
          status: 'pendiente',
          totalAmount: 100,
          createdAt: '2025-10-09T17:00:00Z',
          items: [
            {
              id: 1,
              description: 'Ceviche',
              unitPrice: 50,
              quantity: 2,
              subtotal: 100,
            },
          ],
        },
      ],
    },
  })
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
    // Llama al servicio para obtener todas las órdenes activas
  }

  // 🔍 Obtener una orden por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una orden específica por ID' })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la orden solicitada',
    schema: {
      example: {
        id: 1,
        clientName: 'Ana López',
        status: 'pendiente',
        totalAmount: 100,
        createdAt: '2025-10-09T17:00:00Z',
        items: [
          {
            id: 1,
            description: 'Ceviche',
            unitPrice: 50,
            quantity: 2,
            subtotal: 100,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Order not found',
      },
    },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // El parámetro 'id' se valida como UUID
    return this.ordersService.findOne(id);
    // Llama al servicio para obtener una orden específica
  }

  // 🧾 Crear una orden
  @Post()
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Orden creada correctamente',
    schema: {
      example: {
        id: 1,
        clientName: 'Ana López',
        status: 'pendiente',
        totalAmount: 100,
        createdAt: '2025-10-09T17:00:00Z',
        items: [
          {
            id: 1,
            description: 'Ceviche',
            unitPrice: 50,
            quantity: 2,
            subtotal: 100,
          },
        ],
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  // Aplica validación de DTO y transforma automáticamente los tipos
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
    // Llama al servicio para crear la orden
  }

  // ⏩ Avanzar estado de una orden
  @Post(':id/advance')
  @ApiOperation({ summary: 'Avanzar el estado de una orden (ej: pendiente → completada)' })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @ApiResponse({
    status: 201,
    description: 'Estado de la orden actualizado correctamente',
    schema: {
      example: {
        id: 1,
        clientName: 'Ana López',
        previousStatus: 'pendiente',
        newStatus: 'completada',
        updatedAt: '2025-10-09T17:10:00Z',
      },
    },
  })
  async advanceStatus(
    @Param('id') id: string,
  ): Promise<Order | { message: string }> {
    return this.ordersService.advanceStatus(id);
    // Llama al servicio para actualizar el estado de la orden
  }
}
