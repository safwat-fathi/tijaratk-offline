import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ProductOrderMode } from 'src/common/enums/product-order-mode.enum';
import { parseJsonIfString } from './parse-json.transform';
import { ProductOrderConfigDto } from './product-order-config.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'زيت عباد الشمس' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

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
}
