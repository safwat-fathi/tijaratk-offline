import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectOrderByCustomerDto {
  @ApiPropertyOptional({
    description: 'Optional customer reason for rejecting the whole order.',
    example: 'I do not want to continue this order',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
