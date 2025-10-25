import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  OrderItem,
  OrderItemCreationAttributes,
} from '../entities/order-item.entity';

@Injectable()
// Marca la clase como inyectable para que NestJS pueda usarla en el contenedor de dependencias
export class OrderItemsRepository {
  constructor(
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
    // Inyecta el modelo Sequelize de OrderItem en la propiedad orderItemModel
    // Esto permite interactuar con la tabla 'order_items' de la base de datos
  ) {}


  // Método para crear un nuevo registro de item de orden
  async create(itemData: OrderItemCreationAttributes) {
    // Llama al modelo Sequelize para insertar un nuevo registro
    return this.orderItemModel.create(itemData);
  }

  
  // Método para obtener todos los items asociados a una orden específica
  async findByOrder(orderId: string) {
    // Busca todos los registros de OrderItem que tengan el orderId indicado
    return this.orderItemModel.findAll({ where: { orderId } });
  }
}
