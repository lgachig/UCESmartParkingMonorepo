import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { KafkaService } from '../kafka/kafka.service';
import { OutboxService } from '../outbox/outbox.service';
import { AppRedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateReservationDto } from './dto/reservation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly kafka: KafkaService,
    private readonly outbox: OutboxService,
    private readonly redis: AppRedisService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  private get parkingUrl() {
    return this.configService.get<string>('PARKING_SERVICE_URL');
  }

  private get serviceKey() {
    return this.configService.get<string>('INTERNAL_SERVICE_KEY');
  }

  private get expiryMinutes() {
    return this.configService.get<number>('RESERVATION_EXPIRY_MINUTES') || 15;
  }

  private serviceHeaders() {
    return { 'x-service-key': this.serviceKey };
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private async verifySlotAvailable(slotId: string): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(
          `${this.parkingUrl}/api/internal/slots/${slotId}/availability`,
          { headers: this.serviceHeaders() },
        ),
      );
      const available = res.data?.data ?? res.data;
      if (!available) throw new ConflictException('Slot is not available');
    } catch (err: any) {
      if (err instanceof ConflictException) throw err;
      throw new BadRequestException('Could not verify slot availability');
    }
  }

  private async reserveSlotInParking(slotId: string): Promise<void> {
    await firstValueFrom(
      this.httpService.patch(
        `${this.parkingUrl}/api/internal/slots/${slotId}/reserve`,
        {},
        { headers: this.serviceHeaders() },
      ),
    );
  }

  private async occupySlotInParking(slotId: string): Promise<void> {
    await firstValueFrom(
      this.httpService.patch(
        `${this.parkingUrl}/api/internal/slots/${slotId}/occupy`,
        {},
        { headers: this.serviceHeaders() },
      ),
    );
  }

  private async releaseSlotInParking(slotId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.patch(
          `${this.parkingUrl}/api/internal/slots/${slotId}/release`,
          {},
          { headers: this.serviceHeaders() },
        ),
      );
    } catch (err) {
      this.logger.error(`Failed to release slot ${slotId} in parking-service`, err);
    }
  }

  /**
   * NOTA ACID: la llamada HTTP a parking-service (reserve/occupy/release) NO puede
   * vivir dentro de la transacción Postgres (es otra base de datos/servicio), así que
   * se hace ANTES de abrir la transacción local. Dentro de la transacción sólo entran
   * operaciones atómicas de este servicio: reservation + audit_log + outbox_events.
   * Si algo dentro de la transacción falla, Postgres revierte todo (atomicidad real
   * para los datos que sí son propiedad de este servicio).
   */
  async create(userId: string, dto: CreateReservationDto) {
    const existing = await this.prisma.reservation.findFirst({
      where: { userId, status: { in: ['PENDING', 'ACTIVE'] } },
    });
    if (existing) {
      throw new ConflictException('User already has an active or pending reservation');
    }

    const lockKey = `lock:slot:${dto.slotId}`;
    const acquired = await this.redis.acquireLock(lockKey, 30);
    if (!acquired) {
      throw new ConflictException('Slot is being reserved by another user, try again');
    }

    try {
      await this.verifySlotAvailable(dto.slotId);
      await this.reserveSlotInParking(dto.slotId);

      const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

      const reservation = await this.prisma.$transaction(async (tx) => {
        const created = await tx.reservation.create({
          data: {
            userId,
            vehicleId: dto.vehicleId,
            slotId: dto.slotId,
            reservationCode: this.generateCode(),
            status: 'PENDING',
            expiresAt,
          },
        });

        await this.audit.log(
          {
            action: 'RESERVATION_CREATED',
            authUserId: userId,
            reservationId: created.id,
            metadata: { slotId: dto.slotId, vehicleId: dto.vehicleId, expiresAt },
          },
          tx,
        );

        await this.outbox.record(tx, 'RESERVATION_CREATED', created.id, {
          id: created.id,
          userId,
          slotId: dto.slotId,
          vehicleId: dto.vehicleId,
          reservationCode: created.reservationCode,
          status: created.status,
          expiresAt,
          timestamp: new Date().toISOString(),
        });

        return created;
      });

      return reservation;
    } catch (err) {
      await this.redis.releaseLock(lockKey);
      // compensación: si ya se había reservado el slot en parking-service y la
      // transacción local falló, se libera para no dejar el slot huérfano.
      await this.releaseSlotInParking(dto.slotId);
      throw err;
    }
  }

  async findMyReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async cancel(id: string, userId: string) {
    const reservation = await this.findById(id);

    if (reservation.userId !== userId) {
      throw new BadRequestException('You can only cancel your own reservations');
    }
    if (!['PENDING', 'ACTIVE'].includes(reservation.status)) {
      throw new BadRequestException(`Cannot cancel reservation with status ${reservation.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.reservation.updateMany({
        where: { id, status: reservation.status },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      // Aislamiento: si otra transacción concurrente ya cambió el status, count=0
      if (result.count === 0) {
        throw new ConflictException('Reservation status changed concurrently, retry');
      }

      const fresh = await tx.reservation.findUniqueOrThrow({ where: { id } });

      await this.audit.log(
        { action: 'RESERVATION_CANCELLED', authUserId: userId, reservationId: id },
        tx,
      );

      await this.outbox.record(tx, 'RESERVATION_CANCELLED', id, {
        id,
        userId,
        slotId: reservation.slotId,
        timestamp: new Date().toISOString(),
      });

      return fresh;
    });

    await this.releaseSlotInParking(reservation.slotId);
    await this.redis.releaseLock(`lock:slot:${reservation.slotId}`);

    return updated;
  }

  async adminCancel(id: string, adminUserId: string) {
    const reservation = await this.findById(id);

    if (!['PENDING', 'ACTIVE'].includes(reservation.status)) {
      throw new BadRequestException(`Cannot cancel reservation with status ${reservation.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.reservation.updateMany({
        where: { id, status: reservation.status },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      if (result.count === 0) {
        throw new ConflictException('Reservation status changed concurrently, retry');
      }

      const fresh = await tx.reservation.findUniqueOrThrow({ where: { id } });

      await this.audit.log(
        {
          action: 'RESERVATION_ADMIN_CANCELLED',
          authUserId: adminUserId,
          reservationId: id,
          metadata: {
            ownerId: reservation.userId,
            slotId: reservation.slotId,
            previousStatus: reservation.status,
          },
        },
        tx,
      );

      await this.outbox.record(tx, 'RESERVATION_CANCELLED', id, {
        id,
        userId: reservation.userId,
        slotId: reservation.slotId,
        cancelledBy: adminUserId,
        timestamp: new Date().toISOString(),
      });

      return fresh;
    });

    await this.releaseSlotInParking(reservation.slotId);
    await this.redis.releaseLock(`lock:slot:${reservation.slotId}`);

    return updated;
  }

  async checkIn(id: string, userId: string) {
    const reservation = await this.findById(id);

    if (reservation.userId !== userId) {
      throw new BadRequestException('You can only check-in your own reservations');
    }
    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(`Cannot check-in reservation with status ${reservation.status}`);
    }
    if (new Date() > reservation.expiresAt) {
      throw new BadRequestException('Reservation has expired');
    }

    await this.occupySlotInParking(reservation.slotId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.reservation.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'ACTIVE', checkInAt: new Date() },
      });

      if (result.count === 0) {
        throw new ConflictException('Reservation status changed concurrently, retry');
      }

      const fresh = await tx.reservation.findUniqueOrThrow({ where: { id } });

      await this.audit.log(
        {
          action: 'RESERVATION_CHECKIN',
          authUserId: userId,
          reservationId: id,
          metadata: { checkInAt: fresh.checkInAt },
        },
        tx,
      );

      await this.outbox.record(tx, 'RESERVATION_CHECKIN', id, {
        id,
        userId,
        slotId: reservation.slotId,
        checkInAt: fresh.checkInAt,
        timestamp: new Date().toISOString(),
      });

      return fresh;
    });

    return updated;
  }

  async checkOut(id: string, userId: string) {
    const reservation = await this.findById(id);

    if (reservation.userId !== userId) {
      throw new BadRequestException('You can only check-out your own reservations');
    }
    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot check-out reservation with status ${reservation.status}`);
    }

    const checkOutAt = new Date();
    const checkInAt = reservation.checkInAt!;
    const durationMinutes = Math.ceil((checkOutAt.getTime() - checkInAt.getTime()) / 60000);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.reservation.updateMany({
        where: { id, status: 'ACTIVE' },
        data: { status: 'COMPLETED', checkOutAt, durationMinutes },
      });

      if (result.count === 0) {
        throw new ConflictException('Reservation status changed concurrently, retry');
      }

      const fresh = await tx.reservation.findUniqueOrThrow({ where: { id } });

      await this.audit.log(
        {
          action: 'RESERVATION_CHECKOUT',
          authUserId: userId,
          reservationId: id,
          metadata: { checkOutAt, durationMinutes },
        },
        tx,
      );

      await this.outbox.record(tx, 'RESERVATION_CHECKOUT', id, {
        id,
        userId,
        slotId: reservation.slotId,
        vehicleId: reservation.vehicleId,
        checkInAt,
        checkOutAt,
        durationMinutes,
        timestamp: new Date().toISOString(),
      });

      return fresh;
    });

    await this.releaseSlotInParking(reservation.slotId);
    await this.redis.releaseLock(`lock:slot:${reservation.slotId}`);

    return updated;
  }

  async findRecent(limit = 100, startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
      };
    }

    return this.prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }

  async findByStatus(status: string) {
    return this.prisma.reservation.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatistics() {
    const [total, active, completed, cancelled, expired] = await Promise.all([
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { status: 'ACTIVE' } }),
      this.prisma.reservation.count({ where: { status: 'COMPLETED' } }),
      this.prisma.reservation.count({ where: { status: 'CANCELLED' } }),
      this.prisma.reservation.count({ where: { status: 'EXPIRED' } }),
    ]);

    const avgResult = await this.prisma.reservation.aggregate({
      _avg: { durationMinutes: true },
      where: { status: 'COMPLETED', durationMinutes: { not: null } },
    });

    return {
      total_reservations: total,
      active_reservations: active,
      completed_reservations: completed,
      cancelled_reservations: cancelled,
      expired_reservations: expired,
      average_duration: Math.round(avgResult._avg.durationMinutes ?? 0),
    };
  }

  async findByUserId(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVehicleId(vehicleId: string) {
    return this.prisma.reservation.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlotId(slotId: string) {
    return this.prisma.reservation.findMany({
      where: { slotId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async hasActiveReservationByUser(userId: string) {
    const res = await this.prisma.reservation.findFirst({
      where: { userId, status: { in: ['PENDING', 'ACTIVE'] } },
    });
    return { hasActive: !!res, reservation: res };
  }

  async hasActiveReservationBySlot(slotId: string) {
    const res = await this.prisma.reservation.findFirst({
      where: { slotId, status: { in: ['PENDING', 'ACTIVE'] } },
    });
    return { hasActive: !!res, reservation: res };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async expireReservations() {
    const expired = await this.prisma.reservation.findMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    });

    for (const reservation of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const result = await tx.reservation.updateMany({
            where: { id: reservation.id, status: 'PENDING' },
            data: { status: 'EXPIRED' },
          });

          if (result.count === 0) return; // ya la tomó otro ciclo/proceso

          await this.audit.log(
            {
              action: 'RESERVATION_EXPIRED',
              reservationId: reservation.id,
              metadata: { slotId: reservation.slotId, userId: reservation.userId },
            },
            tx,
          );

          await this.outbox.record(tx, 'RESERVATION_EXPIRED', reservation.id, {
            id: reservation.id,
            userId: reservation.userId,
            slotId: reservation.slotId,
            timestamp: new Date().toISOString(),
          });
        });

        await this.releaseSlotInParking(reservation.slotId);
        await this.redis.releaseLock(`lock:slot:${reservation.slotId}`);

        this.logger.log(`Reservation ${reservation.id} expired and slot ${reservation.slotId} released`);
      } catch (err) {
        this.logger.error(`Failed to expire reservation ${reservation.id}`, err as any);
      }
    }

    if (expired.length > 0) {
      this.logger.log(`Expired ${expired.length} reservation(s)`);
    }
  }
}
