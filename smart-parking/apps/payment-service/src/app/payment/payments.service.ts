import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReservationClientService } from '../clients/reservation-client.service';
import { UserClientService } from '../clients/user-client.service';
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
  ) {}

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
        blocks: fee.blocks,
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
}
