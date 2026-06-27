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

function makeProxy(target: string, pathRewrite?: Record<string, string>) {
  const opts: Options = {
    target,
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
      error: (err, _req, res) => {
        Logger.error(`Proxy error: ${(err as Error).message}`, 'ProxyModule');
        (res as Response).status(502).json({
          statusCode: 502,
          message: 'Servicio no disponible. Intenta de nuevo en unos instantes.',
          error: 'Bad Gateway',
        });
      },
    },
  };
  return createProxyMiddleware(opts);
}

@ApiExcludeController()
@Controller('api/auth')
export class AuthProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    const target = cfg.get<string>('AUTH_SERVICE_URL')!;
    Logger.log(`AuthProxy → ${target}`, 'ProxyModule');
    this.proxy = makeProxy(target);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

@ApiExcludeController()
@Controller('api/users')
@UseGuards(JwtGatewayGuard)
export class UserProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    const target = cfg.get<string>('USER_SERVICE_URL')!;
    Logger.log(`UserProxy → ${target}`, 'ProxyModule');
    this.proxy = makeProxy(target);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

@ApiExcludeController()
@Controller('api/vehicles')
@UseGuards(JwtGatewayGuard)
export class VehicleProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    const target = cfg.get<string>('VEHICLE_SERVICE_URL')!;
    Logger.log(`VehicleProxy → ${target}`, 'ProxyModule');
    this.proxy = makeProxy(target);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

@ApiExcludeController()
@Controller('api/parking')
@UseGuards(JwtGatewayGuard)
export class ParkingProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    const target = cfg.get<string>('PARKING_SERVICE_URL')!;
    Logger.log(`ParkingProxy → ${target}`, 'ProxyModule');
    this.proxy = makeProxy(target, { '^/api/parking': '/api' });
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

@ApiExcludeController()
@Controller('api/reservations')
@UseGuards(JwtGatewayGuard)
export class ReservationProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    const target = cfg.get<string>('RESERVATION_SERVICE_URL')!;
    Logger.log(`ReservationProxy → ${target}`, 'ProxyModule');
    this.proxy = makeProxy(target);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

@ApiExcludeController()
@Controller('api/payments')
@UseGuards(JwtGatewayGuard)
export class PaymentProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    const target = cfg.get<string>('PAYMENT_SERVICE_URL')!;
    Logger.log(`PaymentProxy → ${target}`, 'ProxyModule');
    this.proxy = makeProxy(target);
  }
  @All('*')
  handle(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    this.proxy(req, res, next);
  }
}

@ApiExcludeController()
@Controller('api/stripe')
export class StripeWebhookProxyController {
  private readonly proxy;
  constructor(private readonly cfg: ConfigService) {
    const target = cfg.get<string>('PAYMENT_SERVICE_URL')!;
    Logger.log(`StripeWebhookProxy → ${target}`, 'ProxyModule');
    this.proxy = makeProxy(target);
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
    PaymentProxyController,
    StripeWebhookProxyController,
  ],
})
export class ProxyModule {}