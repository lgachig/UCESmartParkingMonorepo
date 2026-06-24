import { IsNotEmpty, IsString, IsNumber, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ example: 'Zona A' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ZA' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: -0.1985 })
  @IsNumber()
  centerLatitude!: number;

  @ApiProperty({ example: -78.5035 })
  @IsNumber()
  centerLongitude!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  facultyId!: number;
}

export class UpdateZoneDto {
  @ApiPropertyOptional({ example: 'Zona B' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'ZB' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: -0.1986 })
  @IsNumber()
  @IsOptional()
  centerLatitude?: number;

  @ApiPropertyOptional({ example: -78.5036 })
  @IsNumber()
  @IsOptional()
  centerLongitude?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  facultyId?: number;
}
