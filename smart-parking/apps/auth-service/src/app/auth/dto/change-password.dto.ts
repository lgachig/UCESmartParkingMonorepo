import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../validators/is-strong-password.validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password1!' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    example: 'NewPass2@',
    description: 'Min 8 chars, uppercase, lowercase, number, special char',
  })
  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}
