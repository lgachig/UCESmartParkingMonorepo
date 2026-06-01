import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../validators/is-strong-password.validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-from-email' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: 'NewPass2@',
    description: 'Min 8 chars, uppercase, lowercase, number, special char',
  })
  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}
