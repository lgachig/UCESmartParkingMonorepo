import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacultyDto {
  @ApiProperty({ example: 'Facultad de Ingeniería' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'FI' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class UpdateFacultyDto {
  @ApiPropertyOptional({ example: 'Facultad de Ciencias Médicas' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'FCM' })
  @IsString()
  @IsOptional()
  code?: string;
}
