import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class ReplaceOrderItemDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Product ID selected as replacement. Send null to clear.',
    example: 42,
  })
  @IsOptional()
  @IsInt()
  replaced_by_product_id?: number | null;
}
