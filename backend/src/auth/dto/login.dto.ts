import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsPhoneNumber } from 'src/common/validators/is-phone-number.validator';

export class LoginDto {
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+201234567890',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'supersecret',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  pass: string;
}
