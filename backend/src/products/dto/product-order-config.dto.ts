import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuantityUnitOptionDto {
  @ApiProperty({ example: 'piece' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  id: string;

  @ApiProperty({ example: 'بالبيضة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  label: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  multiplier: number;
}

export class QuantityOrderConfigDto {
  @ApiPropertyOptional({ example: 'قطعة' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit_label?: string;

  @ApiPropertyOptional({ type: [QuantityUnitOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuantityUnitOptionDto)
  unit_options?: QuantityUnitOptionDto[];
}

export class WeightOrderConfigDto {
  @ApiPropertyOptional({ type: [Number], example: [250, 500, 1000] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  preset_grams?: number[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allow_custom_grams?: boolean;
}

export class PriceOrderConfigDto {
  @ApiPropertyOptional({ type: [Number], example: [100, 200, 300] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  preset_amounts_egp?: number[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allow_custom_amount?: boolean;
}

export class ProductOrderConfigDto {
  @ApiPropertyOptional({ type: QuantityOrderConfigDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => QuantityOrderConfigDto)
  quantity?: QuantityOrderConfigDto;

  @ApiPropertyOptional({ type: WeightOrderConfigDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WeightOrderConfigDto)
  weight?: WeightOrderConfigDto;

  @ApiPropertyOptional({ type: PriceOrderConfigDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PriceOrderConfigDto)
  price?: PriceOrderConfigDto;
}
