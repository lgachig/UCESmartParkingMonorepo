import { Injectable, Logger } from '@nestjs/common';
import { AppRedisService } from '../redis/redis.service';
import { AuthClientService } from '../clients/auth-client.service';
import { ParkingClientService } from '../clients/parking-client.service';
import { MailService } from '../mail/mail.service';
import { reservationConfirmedTemplate } from '../mail/templates/reservation-confirmed';
import { ReservationClientService } from '../clients/reservation-client.service';
import { reservationCancelledTemplate } from '../mail/templates/reservation-cancelled';
import { reservationExpiredTemplate } from '../mail/templates/reservation-expired';

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

}