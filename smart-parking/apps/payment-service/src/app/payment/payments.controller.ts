import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RabbitmqConsumerService } from '../rabbitmq/rabbitmq-consumer.service';
import { ReceiptService } from './receipt.service';
import { Logger } from '@nestjs/common';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/payments')
export class InternalPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

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
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly receiptService: ReceiptService,
  ) { }

  @ApiOperation({ summary: 'Get my payment history' })
  @Get('my')
  findMyPayments(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.findMyPayments(req.user.userId);
  }

  @ApiOperation({ summary: 'Create payment from a completed reservation' })
  @ApiBody({ type: CreatePaymentDto })
  @Post('from-reservation')
  createFromReservation(
    @Body() dto: CreatePaymentDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.paymentsService.createFromReservationForUser(
      dto.reservationId,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: 'Create Stripe Checkout session for a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 201, description: 'Stripe Checkout session' })
  @Post(':id/checkout')
  createCheckout(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.paymentsService.createStripeCheckout(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get payments by reservation ID' })
  @ApiParam({ name: 'reservationId', description: 'Reservation UUID' })
  @Get('reservation/:reservationId')
  findByReservation(@Param('reservationId') reservationId: string) {
    return this.paymentsService.findByReservationId(reservationId);
  }

  @ApiOperation({ summary: 'Get digital receipt for a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Digital receipt' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  @Get(':id/receipt')
  getReceipt(@Param('id') id: string) {
    return this.receiptService.getReceiptByPaymentId(id);
  }

  @ApiOperation({ summary: 'Get payment statistics for admin dashboard (admin)' })
  @ApiResponse({ status: 200, description: 'Aggregated payment statistics' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stats')
  getStats() {
    return this.paymentsService.getStats();
  }

  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}

@ApiTags('Stripe Webhook')
@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly consumer: RabbitmqConsumerService,
    private readonly receiptService: ReceiptService,
  ) { }

  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      this.logger.warn(
        `Stripe webhook received without ${!rawBody ? 'rawBody' : 'signature'} — check rawBody:true is enabled and STRIPE_WEBHOOK_SECRET is set`,
      );
      return { received: false };
    }

    let event;
    try {
      event = await this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      this.logger.error('Stripe webhook signature verification failed', err);
      return { received: false };
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string;
        metadata: { paymentId: string; reservationId: string; userId: string };
        payment_intent: string | { id: string };
      };

      const { paymentId, reservationId, userId } = session.metadata;
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          stripePaymentIntentId: paymentIntentId,
        },
      });

      try {
        await this.receiptService.createForPayment(paymentId);
      } catch (err) {
        this.logger.error(`Failed to create receipt for payment ${paymentId}`, err);
      }

      await this.audit.log({
        action: 'PAYMENT_COMPLETED',
        authUserId: userId,
        metadata: { paymentId, reservationId, stripeSessionId: session.id },
      });

      await (this.consumer as unknown as {
        publishEvent: (key: string, data: unknown) => Promise<void>;
      })['publishEvent']('payment.completed', {
        paymentId,
        reservationId,
        userId,
        stripeSessionId: session.id,
      });

      this.logger.log(`Payment ${paymentId} completed via Stripe webhook`);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as {
        metadata: { paymentId: string; reservationId: string; userId: string };
      };
      const { paymentId, reservationId, userId } = session.metadata;

      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      });

      await this.audit.log({
        action: 'PAYMENT_FAILED',
        authUserId: userId,
        metadata: { paymentId, reservationId, reason: 'Stripe session expired' },
      });

      await (this.consumer as unknown as {
        publishEvent: (key: string, data: unknown) => Promise<void>;
      })['publishEvent']('payment.failed', {
        paymentId,
        reservationId,
        userId,
        reason: 'Stripe session expired',
      });

      this.logger.log(`Payment ${paymentId} failed — Stripe session expired`);
    }

    return { received: true };
  }
}