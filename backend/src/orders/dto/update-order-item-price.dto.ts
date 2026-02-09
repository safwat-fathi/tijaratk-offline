import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateOrderItemPriceDto {
  @ApiProperty({
    description: 'Final line price for this item in EGP.',
    example: 45.5,
  })
  @IsNumber()
  @IsPositive()
  total_price: number;
}
