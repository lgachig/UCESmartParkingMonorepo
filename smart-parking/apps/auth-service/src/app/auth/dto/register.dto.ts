import { IsEmail, IsNotEmpty, IsString, MinLength,} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  
  @ApiProperty({
    description: 'User email address',
    example: 'lgachig@uce.edu.ec',
  })
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Luis',
  })
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Achig',
  })
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password?: string;
}