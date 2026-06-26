import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CalculateFeeDto, CreatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/payments')
export class InternalPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Calculate parking fee for a reservation (internal)' })
  @ApiBody({ type: CalculateFeeDto })
  @ApiResponse({ status: 200, description: 'Fee calculation result' })
  @Post('calculate')
  calculateFee(@Body() dto: CalculateFeeDto) {
    return this.paymentsService.calculateFeeForReservation(dto.reservationId);
  }

  @ApiOperation({
    summary: 'Create a PENDING payment record from a completed reservation (internal)',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment created with calculated amount' })
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createFromReservation(dto.reservationId);
  }
}

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Get my payment history' })
  @Get('my')
  findMyPayments(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.findMyPayments(req.user.userId);
  }

  @ApiOperation({ summary: 'Get payments by reservation ID' })
  @ApiParam({ name: 'reservationId', description: 'Reservation UUID' })
  @Get('reservation/:reservationId')
  findByReservation(@Param('reservationId') reservationId: string) {
    return this.paymentsService.findByReservationId(reservationId);
  }

  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
