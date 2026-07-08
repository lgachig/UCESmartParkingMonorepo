import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async getStats() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, newLast7Days, newLast30Days, byModel] = await Promise.all([
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.vehicle.count({ where: { createdAt: { gte: last30Days } } }),
      this.prisma.vehicle.groupBy({
        by: ['model'],
        _count: { _all: true },
        orderBy: { _count: { model: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      total,
      newLast7Days,
      newLast30Days,
      topModels: byModel.map((m: { model: string; _count: { _all: number } }) => ({
        model: m.model,
        count: m._count._all,
      })),
    };
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async findMine(authUserId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { authUserId },
    });
    if (!vehicle) {
      throw new NotFoundException('No vehicle registered for this user');
    }
    return vehicle;
  }

  async create(authUserId: string, data: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { authUserId },
    });
    if (existing) {
      throw new ConflictException('User already has a registered vehicle');
    }

    const vehicle = await this.prisma.vehicle.create({
      data: { authUserId, ...data },
    });

    await this.auditService.log({
      action: 'VEHICLE_CREATED',
      authUserId,
      vehicleId: vehicle.id,
    });

    return vehicle;
  }

  async update(authUserId: string, data: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { authUserId },
    });
    if (!vehicle) {
      throw new NotFoundException('No vehicle registered for this user');
    }

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data,
    });

    await this.auditService.log({
      action: 'VEHICLE_UPDATED',
      authUserId,
      vehicleId: vehicle.id,
      metadata: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async remove(authUserId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { authUserId },
    });
    if (!vehicle) {
      throw new NotFoundException('No vehicle registered for this user');
    }

    await this.prisma.vehicle.delete({ where: { id: vehicle.id } });

    await this.auditService.log({
      action: 'VEHICLE_DELETED',
      authUserId,
      vehicleId: vehicle.id,
    });

    return { message: 'Vehicle deleted successfully' };
  }
}