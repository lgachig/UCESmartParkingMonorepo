import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'lgachig@uce.edu.ec' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
