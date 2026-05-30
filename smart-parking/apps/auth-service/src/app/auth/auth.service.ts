import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuditService } from '../audit/audit.service';
import { AppRedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { UserClientService } from '../user-client/user-client.service';
import { Role } from './enums/role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly redisService: AppRedisService,
    private readonly configService: ConfigService,
    private readonly userClientService: UserClientService,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await argon2.hash(data.password);

    const authUser = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role ?? Role.STUDENT,
      },
    });

    try {
      await this.userClientService.createProfile({
        authUserId: authUser.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || 'STUDENT',
      });
    } catch (error) {
      await this.prisma.user.delete({ where: { id: authUser.id } });
      // Log temporal para ver el error real
      console.error('Error creating profile:', JSON.stringify(error));
      throw new ConflictException('Failed to create user profile');
    }

    await this.auditService.log({
      action: 'USER_REGISTERED',
      userId: authUser.id,
      email: authUser.email,
    });

    return { message: 'User registered successfully' };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      await this.auditService.log({
        action: 'LOGIN_FAILED_USER_NOT_FOUND',
        email: data.email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, data.password);

    if (!isPasswordValid) {
      await this.auditService.log({
        action: 'LOGIN_FAILED_INVALID_PASSWORD',
        email: data.email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Guardar refresh token en DB para poder revocarlo
    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.auditService.log({
      action: 'USER_LOGIN',
      userId: user.id,
      email: user.email,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    // Verificar que el token existe en DB y no fue revocado
    const stored = await this.prisma.refreshToken.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Rotar: eliminar el anterior y crear uno nuevo
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });

      const tokens = await this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

      await this.prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: stored.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string) {
    const decoded = this.jwtService.decode(token) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    // Blacklist el access token en Redis
    await this.redisService.blacklistToken(token, expiresIn);

    // Revocar todos los refresh tokens del usuario en DB
    await this.prisma.refreshToken.deleteMany({
      where: { userId: decoded.sub },
    });

    return { message: 'Logout successful' };
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentValid = await argon2.verify(
      user.password,
      data.currentPassword,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await argon2.hash(data.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await this.auditService.log({
      action: 'PASSWORD_CHANGED',
      userId: user.id,
      email: user.email,
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(data: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      const token = randomUUID();
      const ttlSeconds = 3600;

      await this.redisService.set(
        `password-reset:${token}`,
        user.id,
        ttlSeconds,
      );

      this.logger.log(
        `Password reset token generated for ${user.email} (dev: ${token})`,
      );

      await this.auditService.log({
        action: 'PASSWORD_RESET_REQUESTED',
        userId: user.id,
        email: user.email,
      });
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent',
    };
  }

  async resetPassword(data: ResetPasswordDto) {
    const userId = await this.redisService.get(
      `password-reset:${data.token}`,
    );

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await argon2.hash(data.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.redisService.delete(`password-reset:${data.token}`);

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await this.auditService.log({
      action: 'PASSWORD_RESET',
      userId: user.id,
      email: user.email,
    });

    return { message: 'Password reset successfully' };
  }
}