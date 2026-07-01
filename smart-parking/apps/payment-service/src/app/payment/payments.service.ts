import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReservationClientService } from '../clients/reservation-client.service';
import { UserClientService } from '../clients/user-client.service';
import { StripeService } from '../stripe/stripe.service';
import {
  FeeCalculationResult,
  ParkingFeeCalculatorService,
} from './parking-fee-calculator.service';

export interface PaymentWithFee extends FeeCalculationResult {
  paymentId?: string;
  reservationId: string;
  userId: string;
  status?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly feeCalculator: ParkingFeeCalculatorService,
    private readonly reservationClient: ReservationClientService,
    private readonly userClient: UserClientService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) { }

  private resolveDurationMinutes(reservation: {
    durationMinutes: number | null;
    checkInAt: string | null;
    checkOutAt: string | null;
  }): number {
    if (reservation.durationMinutes != null) {
      return reservation.durationMinutes;
    }
    if (reservation.checkInAt && reservation.checkOutAt) {
      const checkIn = new Date(reservation.checkInAt).getTime();
      const checkOut = new Date(reservation.checkOutAt).getTime();
      return Math.ceil((checkOut - checkIn) / 60000);
    }
    throw new BadRequestException(
      'Reservation does not have parking duration information',
    );
  }

  async calculateFeeForReservation(
    reservationId: string,
  ): Promise<PaymentWithFee> {
    const reservation =
      await this.reservationClient.getReservationById(reservationId);
    const profile = await this.userClient.getProfileByAuthUserId(
      reservation.userId,
    );
    const durationMinutes = this.resolveDurationMinutes(reservation);
    const fee = this.feeCalculator.calculate(profile.role, durationMinutes);

    return {
      ...fee,
      reservationId: reservation.id,
      userId: reservation.userId,
    };
  }

  async createFromReservation(reservationId: string) {
    const reservation =
      await this.reservationClient.getReservationById(reservationId);

    if (reservation.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Payment can only be created for completed reservations after checkout',
      );
    }

    const existing = await this.prisma.payment.findFirst({
      where: {
        reservationId,
        status: { in: ['PENDING', 'COMPLETED'] },
      },
    });
    if (existing) {
      throw new ConflictException(
        'A payment already exists for this reservation',
      );
    }

    const profile = await this.userClient.getProfileByAuthUserId(
      reservation.userId,
    );
    const durationMinutes = this.resolveDurationMinutes(reservation);
    const fee = this.feeCalculator.calculate(profile.role, durationMinutes);

    const payment = await this.prisma.payment.create({
      data: {
        reservationId: reservation.id,
        userId: reservation.userId,
        amount: fee.amount,
        currency: fee.currency,
        status: 'PENDING',
      },
    });

    await this.audit.log({
      action: 'PAYMENT_CREATED',
      authUserId: reservation.userId,
      metadata: {
        paymentId: payment.id,
        reservationId,
        amount: fee.amount,
        ratePerHour: fee.ratePerHour,
        durationMinutes: fee.durationMinutes,
        role: fee.role,
      },
    });

    this.logger.log(
      `Payment ${payment.id} created for reservation ${reservationId}: $${fee.amount}`,
    );

    return {
      ...payment,
      fee,
    };
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async findByReservationId(reservationId: string) {
    return this.prisma.payment.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFromReservationForUser(reservationId: string, userId: string) {
    const result = await this.createFromReservation(reservationId);
    if (result.userId !== userId) {
      throw new ForbiddenException('You can only pay for your own reservations');
    }
    return result;
  }

  async createStripeCheckout(paymentId: string, userId: string) {
    const payment = await this.findById(paymentId);
    if (payment.userId !== userId) {
      throw new ForbiddenException('You can only checkout your own payments');
    }
    if (payment.status !== 'PENDING') {
      throw new BadRequestException(`Payment status is ${payment.status}, expected PENDING`);
    }

    const amount = Number(payment.amount);
    const corsOrigins =
      this.configService.get<string>('CORS_ORIGINS') || 'http://localhost:3002';
    const baseUrl = corsOrigins.split(',')[0].trim();

    if (amount === 0) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED' },
      });
      await this.audit.log({
        action: 'PAYMENT_COMPLETED_FREE',
        authUserId: userId,
        metadata: { paymentId, reservationId: payment.reservationId, amount: 0 },
      });
      return {
        url: `${baseUrl}/payment/success?payment_id=${paymentId}`,
        sessionId: '',
        free: true,
      };
    }

    const session = await this.stripeService.createCheckoutSession({
      paymentId: payment.id,
      reservationId: payment.reservationId,
      amount,
      currency: payment.currency,
      userId: payment.userId,
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { stripeSessionId: session.sessionId },
    });

    await this.audit.log({
      action: 'STRIPE_SESSION_CREATED',
      authUserId: userId,
      metadata: {
        paymentId,
        reservationId: payment.reservationId,
        stripeSessionId: session.sessionId,
      },
    });

    return { url: session.url, sessionId: session.sessionId, free: false };
  }
}