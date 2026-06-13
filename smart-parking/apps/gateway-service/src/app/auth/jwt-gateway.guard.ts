import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface GatewayUser {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtGatewayGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Check Redis blacklist (tokens invalidated by auth-service on logout)
    const blacklisted = await this.redis.get(`blacklist:${token}`);
    if (blacklisted) {
      throw new UnauthorizedException('Token revoked, please login again');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET')!;
      const payload = jwt.verify(token, secret) as {
        sub: string;
        email: string;
        role: string;
      };

      // Attach user to request so proxy middleware can forward headers
      (req as any).user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
