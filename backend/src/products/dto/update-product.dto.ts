import { ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ProductOrderMode } from 'src/common/enums/product-order-mode.enum';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { parseJsonIfString } from './parse-json.transform';
import { ProductOrderConfigDto } from './product-order-config.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'زيت عباد الشمس' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ example: 'أخرى' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  current_price?: number;

  @ApiPropertyOptional({
    enum: ProductOrderMode,
    default: ProductOrderMode.QUANTITY,
  })
  @IsOptional()
  @IsEnum(ProductOrderMode)
  order_mode?: ProductOrderMode;

  @ApiPropertyOptional({ type: ProductOrderConfigDto })
  @IsOptional()
  @IsObject()
  @Transform(
    ({ value }: { value: unknown }) => {
      const parsedValue = parseJsonIfString(value);
      if (!parsedValue || typeof parsedValue !== 'object') {
        return parsedValue;
      }

      return plainToInstance(ProductOrderConfigDto, parsedValue);
    },
    { toClassOnly: true },
  )
  @ValidateNested()
  @Type(() => ProductOrderConfigDto)
  order_config?: ProductOrderConfigDto;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
