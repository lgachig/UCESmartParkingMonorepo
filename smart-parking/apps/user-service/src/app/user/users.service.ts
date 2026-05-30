import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateUserProfileDto) {
    return this.prismaService.userProfile.create({
      data,
    });
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
    const profile = await this.prismaService.userProfile.findFirst({
      where: { id, isActive: true },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return profile;
  }

  async findByAuthUserId(authUserId: string) {
    const profile = await this.prismaService.userProfile.findFirst({
      where: { authUserId, isActive: true },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return profile;
  }

  async findMe(authUserId: string) {
    return this.findByAuthUserId(authUserId);
  }

  async updateMe(authUserId: string, data: UpdateUserProfileDto) {
    const profile = await this.findByAuthUserId(authUserId);

    return this.prismaService.userProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  async update(id: string, data: UpdateUserProfileDto) {
    await this.findById(id);

    return this.prismaService.userProfile.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string) {
    await this.findById(id);

    const profile = await this.prismaService.userProfile.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'User profile deactivated successfully',
      profile,
    };
  }
}
