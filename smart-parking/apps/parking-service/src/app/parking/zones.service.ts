import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';
import { AuditService } from '../audit/audit.service';
import { FacultiesService } from './faculties.service';

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly facultiesService: FacultiesService,
  ) {}

  async create(dto: CreateZoneDto, authUserId?: string) {
    // Validate faculty exists
    await this.facultiesService.findOne(dto.facultyId);

    const zone = await this.prisma.zone.create({
      data: {
        name: dto.name,
        code: dto.code,
        centerLatitude: dto.centerLatitude,
        centerLongitude: dto.centerLongitude,
        facultyId: dto.facultyId,
      },
    });

    await this.audit.log({
      action: 'ZONE_CREATED',
      authUserId,
      metadata: { zoneId: zone.id, name: zone.name, code: zone.code, facultyId: zone.facultyId },
    });

    return zone;
  }

  async findAll() {
    return this.prisma.zone.findMany({
      include: { faculty: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }
    return zone;
  }

  async findByFacultyId(facultyId: number) {
    // Validate faculty exists
    await this.facultiesService.findOne(facultyId);

    return this.prisma.zone.findMany({
      where: { facultyId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: number, dto: UpdateZoneDto, authUserId?: string) {
    await this.findOne(id);

    if (dto.facultyId) {
      await this.facultiesService.findOne(dto.facultyId);
    }

    const updated = await this.prisma.zone.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        centerLatitude: dto.centerLatitude,
        centerLongitude: dto.centerLongitude,
        facultyId: dto.facultyId,
      },
    });

    await this.audit.log({
      action: 'ZONE_UPDATED',
      authUserId,
      metadata: { zoneId: id, changes: dto },
    });

    return updated;
  }

  async remove(id: number, authUserId?: string) {
    await this.findOne(id);

    await this.prisma.zone.delete({
      where: { id },
    });

    await this.audit.log({
      action: 'ZONE_DELETED',
      authUserId,
      metadata: { zoneId: id },
    });

    return { message: 'Zone deleted successfully' };
  }
}
