import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResetOrderItemReplacementDto {
  @ApiPropertyOptional({
    description:
      'Optional merchant note for internal usage when resetting decision.',
    example: 'إعادة فتح القرار بعد التواصل مع العميل',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
