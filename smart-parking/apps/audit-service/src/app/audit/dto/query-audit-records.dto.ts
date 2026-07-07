import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryAuditRecordsDto {
  @ApiPropertyOptional({ example: 'reservation-service', description: 'Filter by the service that originated the event' })
  @IsOptional()
  @IsString()
  sourceService?: string;

  @ApiPropertyOptional({ example: 'u-123', description: 'Filter by the user who triggered the event' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'reservation.cancelled', description: 'Filter by action/event type' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z', description: 'Only records created on/after this date' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-06T23:59:59.000Z', description: 'Only records created on/before this date' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 25, default: 25, description: 'Max 100 per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}
