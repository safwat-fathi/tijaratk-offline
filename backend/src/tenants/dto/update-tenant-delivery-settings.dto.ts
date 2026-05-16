import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
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
    example: '14:00',
    description: 'Delivery start time (HH:mm)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'delivery_starts_at must be a valid time in HH:mm format',
  })
  delivery_starts_at?: string;

  @ApiPropertyOptional({
    example: '18:00',
    description: 'Delivery end time (HH:mm)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'delivery_ends_at must be a valid time in HH:mm format',
  })
  delivery_ends_at?: string;
}
