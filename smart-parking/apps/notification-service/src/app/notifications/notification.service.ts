import { Injectable, Logger } from '@nestjs/common';
import { AppRedisService } from '../redis/redis.service';
import { AuthClientService } from '../clients/auth-client.service';
import { ParkingClientService } from '../clients/parking-client.service';
import { MailService } from '../mail/mail.service';
import { reservationConfirmedTemplate } from '../mail/templates/reservation-confirmed';
import { ReservationClientService } from '../clients/reservation-client.service';
import { reservationCancelledTemplate } from '../mail/templates/reservation-cancelled';
import { reservationExpiredTemplate } from '../mail/templates/reservation-expired';
import { paymentProcessedTemplate } from '../mail/templates/payment-processed';
import { paymentFailedTemplate } from '../mail/templates/payment-failed';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SystemAlertEvent {
    service: string;
    severity: AlertSeverity;
    message: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
}

const HIGH_SEVERITY: AlertSeverity[] = ['high', 'critical'];


interface ReservationCancelledEvent {
    id: string;
    userId: string;
    slotId: string;
    cancelledBy?: string;
    timestamp: string;
}

interface ReservationExpiredEvent {
    id: string;
    userId: string;
    slotId: string;
    timestamp: string;
}

interface ReservationCreatedEvent {
    id: string;
    userId: string;
    slotId: string;
    vehicleId: string;
    reservationCode: string;
    status: string;
    expiresAt: string;
    timestamp: string;
}

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private readonly redis: AppRedisService,
        private readonly authClient: AuthClientService,
        private readonly parkingClient: ParkingClientService,
        private readonly reservationClient: ReservationClientService,
        private readonly mail: MailService,
    ) { }



    async handleReservationCreated(data: ReservationCreatedEvent): Promise<void> {
        const idempotencyKey = `notif:reservation-created:${data.id}`;
        const acquired = await this.redis.acquireLock(idempotencyKey, IDEMPOTENCY_TTL_SECONDS);
        if (!acquired) {
            this.logger.log(`Reserva ${data.id} ya fue notificada, se omite duplicado`);
            return;
        }

        try {
            const [user, slot] = await Promise.all([
                this.authClient.getEmailByUserId(data.userId),
                this.parkingClient.getSlotById(data.slotId),
            ]);

            await this.mail.send({
                to: user.email,
                subject: 'Reserva confirmada',
                html: reservationConfirmedTemplate({
                    reservationCode: data.reservationCode,
                    slotNumber: slot.number,
                    zoneName: slot.zone?.name,
                    expiresAt: data.expiresAt,
                }),
            });

            this.logger.log(`Email de confirmación enviado para reserva ${data.id}`);
        } catch (err: any) {
            this.logger.error(
                `Error procesando reservation.created para reserva ${data.id}: ${err.message}`,
            );
        }
    }

    async handleReservationCancelled(data: ReservationCancelledEvent): Promise<void> {
        const idempotencyKey = `notif:reservation-cancelled:${data.id}`;
        const acquired = await this.redis.acquireLock(idempotencyKey, IDEMPOTENCY_TTL_SECONDS);
        if (!acquired) {
            this.logger.log(`Cancelación de reserva ${data.id} ya fue notificada, se omite duplicado`);
            return;
        }

        try {
            const [user, slot, reservation] = await Promise.all([
                this.authClient.getEmailByUserId(data.userId),
                this.parkingClient.getSlotById(data.slotId),
                this.reservationClient.getReservationById(data.id),
            ]);

            await this.mail.send({
                to: user.email,
                subject: 'Reserva cancelada',
                html: reservationCancelledTemplate({
                    reservationCode: reservation.reservationCode,
                    slotNumber: slot.number,
                    zoneName: slot.zone?.name,
                    cancelledByAdmin: !!data.cancelledBy,
                }),
            });

            this.logger.log(`Email de cancelación enviado para reserva ${data.id}`);
        } catch (err: any) {
            this.logger.error(
                `Error procesando reservation.cancelled para reserva ${data.id}: ${err.message}`,
            );
        }
    }

    async handleReservationExpired(data: ReservationExpiredEvent): Promise<void> {
        const idempotencyKey = `notif:reservation-expired:${data.id}`;
        const acquired = await this.redis.acquireLock(idempotencyKey, IDEMPOTENCY_TTL_SECONDS);
        if (!acquired) {
            this.logger.log(`Expiración de reserva ${data.id} ya fue notificada, se omite duplicado`);
            return;
        }

        try {
            const [user, slot, reservation] = await Promise.all([
                this.authClient.getEmailByUserId(data.userId),
                this.parkingClient.getSlotById(data.slotId),
                this.reservationClient.getReservationById(data.id),
            ]);

            await this.mail.send({
                to: user.email,
                subject: 'Reserva expirada',
                html: reservationExpiredTemplate({
                    reservationCode: reservation.reservationCode,
                    slotNumber: slot.number,
                    zoneName: slot.zone?.name,
                }),
            });

            this.logger.log(`Email de expiración enviado para reserva ${data.id}`);
        } catch (err: any) {
            this.logger.error(
                `Error procesando reservation.expired para reserva ${data.id}: ${err.message}`,
            );
        }
    }

    async handlePaymentCompleted(data: {
        paymentId?: string;
        reservationId: string;
        userId?: string;
        free?: boolean;
    }): Promise<void> {
        const idempotencyKey = `notif:payment-completed:${data.paymentId ?? data.reservationId}`;
        const acquired = await this.redis.acquireLock(idempotencyKey, IDEMPOTENCY_TTL_SECONDS);
        if (!acquired) {
            this.logger.log(`Pago para reserva ${data.reservationId} ya fue notificado, se omite duplicado`);
            return;
        }

        try {
            const reservation = await this.reservationClient.getReservationById(data.reservationId);
            const userId = data.userId ?? reservation.userId;
            const user = await this.authClient.getEmailByUserId(userId);

            if (data.free) {
                // Profesor / tarifa $0: no hablar de "pago", confirmar la reserva
                const slot = await this.parkingClient.getSlotById(reservation.slotId);
                await this.mail.send({
                    to: user.email,
                    subject: 'Reserva confirmada',
                    html: reservationConfirmedTemplate({
                        reservationCode: reservation.reservationCode,
                        slotNumber: slot.number,
                        zoneName: slot.zone?.name,
                        expiresAt: reservation.expiresAt,
                    }),
                });
            } else {
                await this.mail.send({
                    to: user.email,
                    subject: 'Pago procesado',
                    html: paymentProcessedTemplate({ reservationCode: reservation.reservationCode }),
                });
            }

            this.logger.log(`Email de pago (completed) enviado para reserva ${data.reservationId}`);
        } catch (err: any) {
            await this.redis.releaseLock(idempotencyKey);
            this.logger.error(
                `Error procesando payment.completed para reserva ${data.reservationId}: ${err.message}`,
            );
            throw err;
        }
    }

    async handlePaymentFailed(data: {
        paymentId?: string;
        reservationId: string;
        userId?: string;
        reason: string;
    }): Promise<void> {
        const idempotencyKey = `notif:payment-failed:${data.paymentId ?? data.reservationId}`;
        const acquired = await this.redis.acquireLock(idempotencyKey, IDEMPOTENCY_TTL_SECONDS);
        if (!acquired) {
            this.logger.log(`Fallo de pago para reserva ${data.reservationId} ya fue notificado, se omite duplicado`);
            return;
        }

        try {
            const reservation = await this.reservationClient.getReservationById(data.reservationId);
            const userId = data.userId ?? reservation.userId;
            const user = await this.authClient.getEmailByUserId(userId);

            await this.mail.send({
                to: user.email,
                subject: 'Pago no procesado',
                html: paymentFailedTemplate({
                    reservationCode: reservation.reservationCode,
                    reason: data.reason,
                }),
            });

            this.logger.log(`Email de pago (failed) enviado para reserva ${data.reservationId}`);
        } catch (err: any) {
            await this.redis.releaseLock(idempotencyKey);
            this.logger.error(
                `Error procesando payment.failed para reserva ${data.reservationId}: ${err.message}`,
            );
            throw err;
        }
    }

    async handleSystemAlert(data: SystemAlertEvent): Promise<void> {
        const context = {
            service: data.service,
            severity: data.severity,
            timestamp: data.timestamp ?? new Date().toISOString(),
            metadata: data.metadata,
        };

        if (data.severity === 'critical') {
            this.logger.error(`[ALERT][${data.service}][${data.severity}] ${data.message}`, context);
        } else if (data.severity === 'high') {
            this.logger.warn(`[ALERT][${data.service}][${data.severity}] ${data.message}`, context);
        } else {
            this.logger.log(`[ALERT][${data.service}][${data.severity}] ${data.message}`, context);
        }

        if (HIGH_SEVERITY.includes(data.severity)) {
            this.logger.debug(
                `Alerta de severidad ${data.severity} recibida de ${data.service} — pendiente de notificación a administradores (no implementado en esta fase)`,
            );
        }
    }

}