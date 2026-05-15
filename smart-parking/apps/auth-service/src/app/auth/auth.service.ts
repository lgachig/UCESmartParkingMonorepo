import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async register(data: RegisterDto) {
    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'User already exists',
      );
    }

    const hashedPassword = await argon2.hash(
      data.password,
    );

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
      },
    });

    return {
      message:
        'User registered successfully',
      user,
    };
  }
}