import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

import * as argon2 from 'argon2';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

  async login(data: LoginDto) {
    
  const user = await this.prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new UnauthorizedException(
      'Dont found any user with the provided email',
    );
  }

  const isPasswordValid = await argon2.verify(
    user.password,
    data.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedException(
      'Password is incorrect',
    );
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = await this.jwtService.signAsync(payload);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }
  };
  }
}