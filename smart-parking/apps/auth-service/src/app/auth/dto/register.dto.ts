import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';
import { IsStrongPassword } from '../validators/is-strong-password.validator';

export class RegisterDto {
  @ApiProperty({ example: 'lgachig@uce.edu.ec' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Password1!',
    description: 'Min 8 chars, uppercase, lowercase, number, special char',
  })
  @IsString()
  @IsStrongPassword()
  password!: string;

  @ApiProperty({ example: 'Luis' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Achig' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '+593999999999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}