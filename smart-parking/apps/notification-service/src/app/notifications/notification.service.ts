import { Injectable, Logger } from '@nestjs/common';
import { AppRedisService } from '../redis/redis.service';
import { AuthClientService } from '../clients/auth-client.service';
import { ParkingClientService } from '../clients/parking-client.service';
import { MailService } from '../mail/mail.service';
import { reservationConfirmedTemplate } from '../mail/templates/reservation-confirmed';

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
}