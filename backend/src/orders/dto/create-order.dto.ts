import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OrderType } from 'src/common/enums/order-type.enum';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { OrderItemSelectionMode } from 'src/common/enums/order-item-selection-mode.enum';

export class CreateOrderItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  product_id?: number;

  @ApiPropertyOptional({ example: 'عيش بلدي' })
  @ValidateIf((dto: CreateOrderItemDto) => !dto.product_id)
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: '2' })
  @IsString()
  @MaxLength(50)
  quantity: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;

  @ApiPropertyOptional({ enum: OrderItemSelectionMode })
  @IsOptional()
  @IsEnum(OrderItemSelectionMode)
  selection_mode?: OrderItemSelectionMode;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  selection_quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  selection_grams?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  selection_amount_egp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  unit_option_id?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer: CreateCustomerDto;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  order_type: OrderType;

  @ApiPropertyOptional({ type: [CreateOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  free_text_payload?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  delivery_fee?: number;
}
