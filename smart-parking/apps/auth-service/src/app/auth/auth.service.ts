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
        "Don't found any user with the provided email",
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

    const tokens = await this.generateTokens( user.id, user.email, user.role,);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    };
  }

  async generateTokens(
    userId: string,
    email: string,
    role: string,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      });

    const refreshToken =
      await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {

    try {
      const payload =
        await this.jwtService.verifyAsync(token, {
          secret:
            process.env.JWT_REFRESH_SECRET,
        });

      return this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

    } catch {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }
  }
}