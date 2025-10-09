import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';

export interface OrderAttributes {
  id: string;
  clientName: string;
  totalAmount: number;
  status: 'initiated' | 'sent' | 'delivered';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes
  extends Omit<OrderAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {
  status?: 'initiated' | 'sent' | 'delivered';
}

@Table({ tableName: 'orders' })
export class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare clientName: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare totalAmount: number;

  @Column({
    type: DataType.ENUM('initiated', 'sent', 'delivered'),
    allowNull: false,
    defaultValue: 'initiated',
  })
  declare status: 'initiated' | 'sent' | 'delivered';

  @HasMany(() => OrderItem)
  declare items: OrderItem[];

  // 🕓 timestamps automáticos de Sequelize
  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
