import { IsNotEmpty, IsString, IsNumber, IsInt, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  DISABLED = 'DISABLED',
}

export class CreateSlotDto {
  @ApiPropertyOptional({ example: '406fda9e-8ebc-4816-95d7-6af3d1af4392' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'A-01' })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({ enum: SlotStatus, default: SlotStatus.AVAILABLE })
  @IsEnum(SlotStatus)
  @IsOptional()
  status?: SlotStatus;

  @ApiProperty({ example: -0.19851 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: -78.50351 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  zoneId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  facultyId!: number;
}

export class UpdateSlotDto {
  @ApiPropertyOptional({ example: 'A-02' })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ enum: SlotStatus })
  @IsEnum(SlotStatus)
  @IsOptional()
  status?: SlotStatus;

  @ApiPropertyOptional({ example: -0.19852 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -78.50352 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  zoneId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  facultyId?: number;
}

export class SearchSlotsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  facultyId?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  zoneId?: number;

  @ApiPropertyOptional({ enum: SlotStatus })
  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;
}

export class NearbySlotsQueryDto {
  @ApiProperty({ example: -0.1985 })
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -78.5035 })
  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  radius!: number;
}
