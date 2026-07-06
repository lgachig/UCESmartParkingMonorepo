import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class SubscribeZoneDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    zoneId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    facultyId?: number;
}