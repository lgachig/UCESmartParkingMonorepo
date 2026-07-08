import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AppRedisService } from '../redis/redis.service';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly redisService: AppRedisService,
  ) { }

  async create(data: CreateUserProfileDto) {
    const profile = await this.prismaService.userProfile.create({ data });

    await this.auditService.log({
      action: 'USER_CREATED',
      authUserId: profile.authUserId,
      profileId: profile.id,
    });

    return profile;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.userProfile.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.userProfile.count({
        where: { isActive: true },
      }),
    ]);

    return { data, total, page, limit };
  }

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      isActive: true,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' as const } },
        { lastName: { contains: query, mode: 'insensitive' as const } },
        { phone: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prismaService.userProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.userProfile.count({ where }),
    ]);

    return { data, total, page, limit, query };
  }

  async findById(id: string) {
    const cacheKey = `user-profile:id:${id}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {

    }

    const profile = await this.prismaService.userProfile.findFirst({
      where: { id, isActive: true },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    try {
      await this.redisService.set(cacheKey, JSON.stringify(profile), 3600);
    } catch (err) {

    }

    return profile;
  }

  async findByAuthUserId(authUserId: string) {
    const cacheKey = `user-profile:auth:${authUserId}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {

    }

    const profile = await this.prismaService.userProfile.findFirst({
      where: { authUserId, isActive: true },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    try {
      await this.redisService.set(cacheKey, JSON.stringify(profile), 3600);
    } catch (err) {

    }

    return profile;
  }

  async findMe(authUserId: string) {
    return this.findByAuthUserId(authUserId);
  }

  async getStats() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, active, inactive, newLast7Days, newLast30Days, byRoleRaw] =
      await Promise.all([
        this.prismaService.userProfile.count(),
        this.prismaService.userProfile.count({ where: { isActive: true } }),
        this.prismaService.userProfile.count({ where: { isActive: false } }),
        this.prismaService.userProfile.count({
          where: { createdAt: { gte: last7Days } },
        }),
        this.prismaService.userProfile.count({
          where: { createdAt: { gte: last30Days } },
        }),
        this.prismaService.userProfile.groupBy({
          by: ['role'],
          where: { isActive: true },
          _count: { _all: true },
        }),
      ]);

    const byRole = byRoleRaw.reduce(
      (acc: Record<string, number>, row: { role: string; _count: { _all: number } }) => {
        acc[row.role] = row._count._all;
        return acc;
      },
      {},
    );

    const recentProfiles = await this.prismaService.userProfile.findMany({
      where: { createdAt: { gte: last30Days } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      total,
      active,
      inactive,
      newLast7Days,
      newLast30Days,
      byRole,
      recentProfiles,
    };
  }

  async updateMe(authUserId: string, data: UpdateUserProfileDto) {
    const profile = await this.findByAuthUserId(authUserId);
    const updated = await this.prismaService.userProfile.update({
      where: { id: profile.id },
      data,
    });

    await this.invalidateCache(profile);

    await this.auditService.log({
      action: 'PROFILE_UPDATED',
      authUserId,
      profileId: profile.id,
      metadata: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async update(id: string, data: UpdateUserProfileDto) {
    await this.findById(id);
    const updated = await this.prismaService.userProfile.update({
      where: { id },
      data,
    });

    await this.invalidateCache(updated);

    await this.auditService.log({
      action: 'USER_UPDATED',
      authUserId: updated.authUserId,
      profileId: id,
      metadata: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deactivate(id: string) {
    const profile = await this.findById(id);
    const updated = await this.prismaService.userProfile.update({
      where: { id },
      data: { isActive: false },
    });

    await this.invalidateCache(profile);

    await this.auditService.log({
      action: 'USER_DEACTIVATED',
      authUserId: profile.authUserId,
      profileId: id,
    });

    return {
      message: 'User profile deactivated successfully',
      profile: updated,
    };
  }

  private async invalidateCache(profile: { id: string; authUserId: string }) {
    try {
      await Promise.all([
        this.redisService.delete(`user-profile:id:${profile.id}`),
        this.redisService.delete(`user-profile:auth:${profile.authUserId}`),
      ]);
    } catch (err) {

    }
  }
}
