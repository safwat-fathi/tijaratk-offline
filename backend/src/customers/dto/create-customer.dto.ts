import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsPhoneNumber } from 'src/common/validators/is-phone-number.validator';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
	@IsPhoneNumber({allowedCountries: ['EG']})
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
