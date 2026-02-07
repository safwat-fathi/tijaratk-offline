import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AddProductFromCatalogDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  catalog_item_id: number;
}
