import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetAvailabilitySummaryDto {
  @ApiPropertyOptional({
    description: 'Number of days to include in summary',
    default: 1,
    minimum: 1,
    maximum: 30,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number = 1;

  @ApiPropertyOptional({
    description: 'Maximum number of products in top requested list',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}
