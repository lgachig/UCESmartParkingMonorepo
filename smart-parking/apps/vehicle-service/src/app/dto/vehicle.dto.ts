import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  @IsNotEmpty()
  registrationNumber!: string;

  @ApiProperty({ example: 'PBC-9876' })
  @IsString()
  @IsNotEmpty()
  plate!: string;

  @ApiProperty({ example: 'Black' })
  @IsString()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({ example: 'Toyota Corolla' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'ABC-1234' })
  @IsString()
  @IsNotEmpty()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'PBC-9876' })
  @IsString()
  @IsNotEmpty()
  plate?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsString()
  @IsNotEmpty()
  color?: string;

  @ApiPropertyOptional({ example: 'Chevrolet Sail' })
  @IsString()
  @IsNotEmpty()
  model?: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;
}
