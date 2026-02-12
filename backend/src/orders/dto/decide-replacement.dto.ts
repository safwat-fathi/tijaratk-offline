import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReplacementDecisionAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class DecideReplacementDto {
  @ApiProperty({
    enum: ReplacementDecisionAction,
    description: 'Customer decision for the pending replacement.',
    example: ReplacementDecisionAction.APPROVE,
  })
  @IsEnum(ReplacementDecisionAction)
  decision: ReplacementDecisionAction;

  @ApiPropertyOptional({
    description: 'Optional customer reason (mainly used for rejection).',
    example: 'أريد المنتج الأصلي فقط',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
