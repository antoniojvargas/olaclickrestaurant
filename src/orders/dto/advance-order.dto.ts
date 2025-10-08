import { IsIn } from 'class-validator';

export class AdvanceOrderStatusDto {
  @IsIn(['initiated', 'sent', 'delivered'])
  status: 'initiated' | 'sent' | 'delivered';
}
