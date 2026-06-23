import {
  All,
  Controller,
  Logger,
  Next,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import { JwtGatewayGuard, GatewayUser } from '../auth/jwt-gateway.guard';
import { IncomingMessage } from 'http';

function makeProxy(target: string, pathRewrite?: Record<string, string>) {
  let normalizedTarget = target;
  if (target && target.endsWith('/api')) {
    normalizedTarget = target.substring(0, target.length - 4);
  }
  const opts: Options = {
    target: normalizedTarget,
    changeOrigin: true,
    pathRewrite,
    on: {
      proxyReq: (proxyReq, req) => {
        const user: GatewayUser | undefined = (req as any).user;
        if (user) {
          proxyReq.setHeader('x-user-id', user.userId);
          proxyReq.setHeader('x-user-email', user.email);
          proxyReq.setHeader('x-user-role', user.role);
        }
      },
      error: (_err, _req, res) => {
        (res as Response).status(502).json({
          statusCode: 502,
          message: 'Upstream service unavailable',
        });
      },
    },
  };
  return createProxyMiddleware(opts);
}

// ─── Auth Service (no JWT required — login, register, refresh) ──────────────
@ApiExcludeController()
@Controller('auth')
export class AuthProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    this.proxy = makeProxy(cfg.get<string>('AUTH_SERVICE_URL')!);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

// ─── User Service ────────────────────────────────────────────────────────────
@ApiExcludeController()
@Controller('users')
@UseGuards(JwtGatewayGuard)
export class UserProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    this.proxy = makeProxy(cfg.get<string>('USER_SERVICE_URL')!);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

// ─── Vehicle Service ─────────────────────────────────────────────────────────
@ApiExcludeController()
@Controller('vehicles')
@UseGuards(JwtGatewayGuard)
export class VehicleProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    this.proxy = makeProxy(cfg.get<string>('VEHICLE_SERVICE_URL')!);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

// ─── Parking Service ─────────────────────────────────────────────────────────
@ApiExcludeController()
@Controller('parking')
@UseGuards(JwtGatewayGuard)
export class ParkingProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    this.proxy = makeProxy(cfg.get<string>('PARKING_SERVICE_URL')!);
  }
  
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

// ─── Reservation Service ─────────────────────────────────────────────────────
@ApiExcludeController()
@Controller('reservations')
@UseGuards(JwtGatewayGuard)
export class ReservationProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    this.proxy = makeProxy(cfg.get<string>('RESERVATION_SERVICE_URL')!);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    AuthProxyController,
    UserProxyController,
    VehicleProxyController,
    ParkingProxyController,
    ReservationProxyController,
  ],
})
export class ProxyModule {}
