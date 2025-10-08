import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Order } from './order.entity';

interface OrderItemAttributes {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
}

interface OrderItemCreationAttributes extends Omit<OrderItemAttributes, 'id'> {}

@Table({ tableName: 'order_items' })
export class OrderItem extends Model<
  OrderItemAttributes,
  OrderItemCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ allowNull: false })
  declare description: string;

  @Column({ allowNull: false })
  declare quantity: number;

  @Column({ allowNull: false })
  declare unitPrice: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID })
  declare orderId: string;

  @BelongsTo(() => Order)
  declare order: Order;
}
