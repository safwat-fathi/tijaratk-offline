import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Payload for merchant delivery settings updates.
 */
export class UpdateTenantDeliverySettingsDto {
  @ApiProperty({ example: 15, description: 'Fixed delivery fee in EGP' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  delivery_fee: number;

  @ApiProperty({
    example: true,
    description: 'Whether delivery orders are available',
  })
  @IsBoolean()
  delivery_available: boolean;

  @ApiPropertyOptional({
    example: '2-4 مساءً',
    description: 'Merchant-facing delivery time window text',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  delivery_time_window?: string;
}
