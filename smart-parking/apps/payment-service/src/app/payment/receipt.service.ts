import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ReservationClientService } from '../clients/reservation-client.service';
import { UserClientService } from '../clients/user-client.service';

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationClient: ReservationClientService,
    private readonly userClient: UserClientService,
  ) {}

  async createForPayment(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const existing = await this.prisma.receipt.findUnique({
      where: { paymentId },
    });
    if (existing) {
      this.logger.warn(`Receipt already exists for payment ${paymentId}`);
      return;
    }

    const reservation = await this.reservationClient.getReservationById(
      payment.reservationId,
    );
    const user = await this.userClient.getProfileByAuthUserId(payment.userId);

    const receiptNumber = `RCP-${Date.now()}-${paymentId.slice(0, 8).toUpperCase()}`;

    await this.prisma.receipt.create({
      data: {
        receiptNumber,
        paymentId: payment.id,
        reservationId: payment.reservationId,
        vehicle: { vehicleId: reservation.vehicleId, slotId: reservation.slotId },
        user: {
          authUserId: user.authUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: 'card',
        status: 'COMPLETED',
      },
    });

    this.logger.log(`Receipt ${receiptNumber} created for payment ${paymentId}`);
  }

  async getReceiptByPaymentId(paymentId: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { paymentId },
      include: { payment: true },
    });

    if (!receipt) throw new NotFoundException('Receipt not found');

    return {
      receiptNumber: receipt.receiptNumber,
      paymentId: receipt.paymentId,
      reservationId: receipt.reservationId,
      vehicle: receipt.vehicle,
      user: receipt.user,
      amount: receipt.amount,
      currency: receipt.currency,
      paymentMethod: receipt.paymentMethod,
      status: receipt.status,
      createdAt: receipt.createdAt,
    };
  }
}