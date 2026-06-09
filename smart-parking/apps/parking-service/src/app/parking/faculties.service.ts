import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/faculty.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FacultiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateFacultyDto, authUserId?: string) {
    const existing = await this.prisma.faculty.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Faculty with code ${dto.code} already exists`);
    }

    const faculty = await this.prisma.faculty.create({
      data: dto,
    });

    await this.audit.log({
      action: 'FACULTY_CREATED',
      authUserId,
      metadata: { facultyId: faculty.id, name: faculty.name, code: faculty.code },
    });

    return faculty;
  }

  async findAll() {
    return this.prisma.faculty.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
    });
    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }
    return faculty;
  }

  async update(id: number, dto: UpdateFacultyDto, authUserId?: string) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.faculty.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Faculty with code ${dto.code} already exists`);
      }
    }

    const updated = await this.prisma.faculty.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      action: 'FACULTY_UPDATED',
      authUserId,
      metadata: { facultyId: id, changes: dto },
    });

    return updated;
  }

  async remove(id: number, authUserId?: string) {
    await this.findOne(id);

    await this.prisma.faculty.delete({
      where: { id },
    });

    await this.audit.log({
      action: 'FACULTY_DELETED',
      authUserId,
      metadata: { facultyId: id },
    });

    return { message: 'Faculty deleted successfully' };
  }
}
