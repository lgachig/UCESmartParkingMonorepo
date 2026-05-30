import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-from-email' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'newpassword456' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
