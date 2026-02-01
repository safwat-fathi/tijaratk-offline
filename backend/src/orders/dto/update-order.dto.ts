import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from 'src/common/enums/order-status.enum';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
