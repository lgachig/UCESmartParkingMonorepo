import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSlotDto, UpdateSlotDto, SlotStatus } from './dto/slot.dto';
import { AuditService } from '../audit/audit.service';
import { KafkaService } from '../kafka/kafka.service';
import { AppRedisService } from '../redis/redis.service';
import { ZonesService } from './zones.service';
import { FacultiesService } from './faculties.service';

@Injectable()
export class SlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly kafka: KafkaService,
    private readonly redis: AppRedisService,
    private readonly zonesService: ZonesService,
    private readonly facultiesService: FacultiesService,
  ) {}

  private async invalidateCache() {
    await this.redis.delete('parking:stats:global');
    await this.redis.delete('parking:slots:available');
    await this.redis.delete('parking:stats:faculties');
    await this.redis.delete('parking:stats:zones');
  }

  async create(dto: CreateSlotDto, authUserId?: string) {
    // Validate faculty and zone exist
    await this.facultiesService.findOne(dto.facultyId);
    await this.zonesService.findOne(dto.zoneId);

    // Check if slot number already exists in this zone
    const existing = await this.prisma.slot.findFirst({
      where: { number: dto.number, zoneId: dto.zoneId },
    });
    if (existing) {
      throw new ConflictException(`Slot number ${dto.number} already exists in this zone`);
    }

    const slot = await this.prisma.slot.create({
      data: {
        id: dto.id,
        number: dto.number,
        status: dto.status ?? SlotStatus.AVAILABLE,
        latitude: dto.latitude,
        longitude: dto.longitude,
        zoneId: dto.zoneId,
        facultyId: dto.facultyId,
      },
      include: { zone: true, faculty: true },
    });

    await this.invalidateCache();

    await this.audit.log({
      action: 'SLOT_CREATED',
      authUserId,
      slotId: slot.id,
      metadata: { number: slot.number, zoneId: slot.zoneId, status: slot.status },
    });

    await this.kafka.emit('slot.created', {
      id: slot.id,
      number: slot.number,
      status: slot.status,
      latitude: slot.latitude,
      longitude: slot.longitude,
      zoneId: slot.zoneId,
      facultyId: slot.facultyId,
      timestamp: new Date().toISOString(),
    });

    return slot;
  }

  async findAll() {
    return this.prisma.slot.findMany({
      include: { zone: true, faculty: true },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const slot = await this.prisma.slot.findUnique({
      where: { id },
      include: { zone: true, faculty: true },
    });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${id} not found`);
    }
    return slot;
  }

  async update(id: string, dto: UpdateSlotDto, authUserId?: string) {
    const slot = await this.findOne(id);

    if (dto.facultyId) {
      await this.facultiesService.findOne(dto.facultyId);
    }
    if (dto.zoneId) {
      await this.zonesService.findOne(dto.zoneId);
    }

    if (dto.number && dto.number !== slot.number) {
      const targetZoneId = dto.zoneId ?? slot.zoneId;
      const existing = await this.prisma.slot.findFirst({
        where: { number: dto.number, zoneId: targetZoneId, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Slot number ${dto.number} already exists in this zone`);
      }
    }

    const updated = await this.prisma.slot.update({
      where: { id },
      data: dto,
      include: { zone: true, faculty: true },
    });

    await this.invalidateCache();

    await this.audit.log({
      action: 'SLOT_UPDATED',
      authUserId,
      slotId: id,
      metadata: { changes: dto },
    });

    await this.kafka.emit('slot.updated', {
      id: updated.id,
      number: updated.number,
      status: updated.status,
      latitude: updated.latitude,
      longitude: updated.longitude,
      zoneId: updated.zoneId,
      facultyId: updated.facultyId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async remove(id: string, authUserId?: string) {
    await this.findOne(id);

    await this.prisma.slot.delete({
      where: { id },
    });

    await this.invalidateCache();

    await this.audit.log({
      action: 'SLOT_DELETED',
      authUserId,
      slotId: id,
    });

    await this.kafka.emit('slot.deleted', {
      id,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Slot deleted successfully' };
  }

  // --- STATE CHANGES ---

  async changeStatus(id: string, fromStatus: SlotStatus | SlotStatus[], toStatus: SlotStatus, eventName: string, authUserId?: string) {
    const slot = await this.findOne(id);

    const allowed = Array.isArray(fromStatus)
      ? fromStatus.includes(slot.status)
      : slot.status === fromStatus;

    if (!allowed) {
      throw new BadRequestException(
        `Cannot change slot state from ${slot.status} to ${toStatus}. Expected current state: ${
          Array.isArray(fromStatus) ? fromStatus.join(' or ') : fromStatus
        }`,
      );
    }

    const updated = await this.prisma.slot.update({
      where: { id },
      data: { status: toStatus },
      include: { zone: true, faculty: true },
    });

    await this.invalidateCache();

    await this.audit.log({
      action: `SLOT_${toStatus}`,
      authUserId,
      slotId: id,
      metadata: { previousStatus: slot.status, currentStatus: toStatus },
    });

    await this.kafka.emit(eventName, {
      id: updated.id,
      number: updated.number,
      status: updated.status,
      previousStatus: slot.status,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async reserve(id: string, authUserId?: string) {
    return this.changeStatus(id, SlotStatus.AVAILABLE, SlotStatus.RESERVED, 'slot.reserved', authUserId);
  }

  async occupy(id: string, authUserId?: string) {
    return this.changeStatus(id, SlotStatus.RESERVED, SlotStatus.OCCUPIED, 'slot.occupied', authUserId);
  }

  async release(id: string, authUserId?: string) {
    return this.changeStatus(id, [SlotStatus.RESERVED, SlotStatus.OCCUPIED], SlotStatus.AVAILABLE, 'slot.released', authUserId);
  }

  async maintenance(id: string, authUserId?: string) {
    return this.changeStatus(id, [SlotStatus.AVAILABLE, SlotStatus.RESERVED, SlotStatus.OCCUPIED, SlotStatus.DISABLED], SlotStatus.MAINTENANCE, 'slot.maintenance', authUserId);
  }

  async enable(id: string, authUserId?: string) {
    return this.changeStatus(id, SlotStatus.MAINTENANCE, SlotStatus.AVAILABLE, 'slot.enabled', authUserId);
  }

  // --- AVAILABILITY QUERIES ---

  async findByStatus(status: SlotStatus) {
    if (status === SlotStatus.AVAILABLE) {
      const cached = await this.redis.get('parking:slots:available');
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const slots = await this.prisma.slot.findMany({
      where: { status },
      include: { zone: true, faculty: true },
      orderBy: { number: 'asc' },
    });

    if (status === SlotStatus.AVAILABLE) {
      await this.redis.set('parking:slots:available', JSON.stringify(slots), 30);
    }

    return slots;
  }

  async search(facultyId?: number, zoneId?: number, status?: SlotStatus) {
    return this.prisma.slot.findMany({
      where: {
        facultyId,
        zoneId,
        status,
      },
      include: { zone: true, faculty: true },
      orderBy: { number: 'asc' },
    });
  }

  // --- GEOLOCATION ---

  async findNearby(lat: number, lng: number, radiusMeters: number) {
    // Get all AVAILABLE slots
    const availableSlots = await this.findByStatus(SlotStatus.AVAILABLE);

    // Calculate distances using Haversine formula
    const nearby = availableSlots
      .map((slot: any) => {
        const distance = this.haversineDistance(lat, lng, slot.latitude, slot.longitude);
        return { ...slot, distance };
      })
      .filter((slot: any) => slot.distance <= radiusMeters)
      .sort((a: any, b: any) => a.distance - b.distance);

    return nearby;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
  }

  // --- STATISTICS ---

  async getGlobalStats() {
    const cached = await this.redis.get('parking:stats:global');
    if (cached) {
      return JSON.parse(cached);
    }

    const allSlots = await this.prisma.slot.findMany();
    const stats = {
      totalSlots: allSlots.length,
      available: allSlots.filter((s) => s.status === SlotStatus.AVAILABLE).length,
      occupied: allSlots.filter((s) => s.status === SlotStatus.OCCUPIED).length,
      reserved: allSlots.filter((s) => s.status === SlotStatus.RESERVED).length,
      maintenance: allSlots.filter((s) => s.status === SlotStatus.MAINTENANCE).length,
      disabled: allSlots.filter((s) => s.status === SlotStatus.DISABLED).length,
    };

    await this.redis.set('parking:stats:global', JSON.stringify(stats), 30);
    return stats;
  }

  async getFacultyStats() {
    const cached = await this.redis.get('parking:stats:faculties');
    if (cached) {
      return JSON.parse(cached);
    }

    const faculties = await this.prisma.faculty.findMany({
      include: { slots: true },
    });

    const stats = faculties.map((f) => ({
      facultyId: f.id,
      facultyName: f.name,
      facultyCode: f.code,
      totalSlots: f.slots.length,
      available: f.slots.filter((s) => s.status === SlotStatus.AVAILABLE).length,
      occupied: f.slots.filter((s) => s.status === SlotStatus.OCCUPIED).length,
      reserved: f.slots.filter((s) => s.status === SlotStatus.RESERVED).length,
      maintenance: f.slots.filter((s) => s.status === SlotStatus.MAINTENANCE).length,
      disabled: f.slots.filter((s) => s.status === SlotStatus.DISABLED).length,
    }));

    await this.redis.set('parking:stats:faculties', JSON.stringify(stats), 30);
    return stats;
  }

  async getZoneStats() {
    const cached = await this.redis.get('parking:stats:zones');
    if (cached) {
      return JSON.parse(cached);
    }

    const zones = await this.prisma.zone.findMany({
      include: { slots: true, faculty: true },
    });

    const stats = zones.map((z) => ({
      zoneId: z.id,
      zoneName: z.name,
      zoneCode: z.code,
      facultyId: z.facultyId,
      facultyName: z.faculty.name,
      totalSlots: z.slots.length,
      available: z.slots.filter((s) => s.status === SlotStatus.AVAILABLE).length,
      occupied: z.slots.filter((s) => s.status === SlotStatus.OCCUPIED).length,
      reserved: z.slots.filter((s) => s.status === SlotStatus.RESERVED).length,
      maintenance: z.slots.filter((s) => s.status === SlotStatus.MAINTENANCE).length,
      disabled: z.slots.filter((s) => s.status === SlotStatus.DISABLED).length,
    }));

    await this.redis.set('parking:stats:zones', JSON.stringify(stats), 30);
    return stats;
  }
}
