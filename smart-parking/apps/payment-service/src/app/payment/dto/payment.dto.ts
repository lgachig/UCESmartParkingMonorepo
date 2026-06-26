import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Reservation UUID' })
  @IsUUID()
  reservationId!: string;
}

export class CalculateFeeDto {
  @ApiProperty({ description: 'Reservation UUID' })
  @IsUUID()
  reservationId!: string;
}
