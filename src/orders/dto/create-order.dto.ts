import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Trim,
  Escape,
  ToInt,
  ToFloat,
} from 'class-sanitizer';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  @Escape()
  description: string;

  @IsNumber()
  @Min(0, { message: 'El precio unitario debe ser mayor o igual a 0' })
  @ToFloat()
  unitPrice: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @ToInt()
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @Trim()
  @Escape()
  clientName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
