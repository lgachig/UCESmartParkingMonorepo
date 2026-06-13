import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'uuid-del-slot' })
  @IsUUID()
  @IsNotEmpty()
  slotId!: string;

  @ApiProperty({ example: 'uuid-del-vehiculo' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId!: string;
}