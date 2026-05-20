import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { AppRedisService } from '../../redis/redis.service';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common'; 
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy,) {

  constructor(
    private readonly redisService: AppRedisService,
    configService: ConfigService,
  ) {

    const options:
      StrategyOptionsWithRequest = {
        jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET',)!,
        passReqToCallback: true,
    };
    super(options);
  }
 
  async validate( req: Request, payload: JwtPayload,) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided',);
    }
    const token = authHeader.split(' ')[1];

    const isBlacklisted = await this.redisService.isBlacklisted(token,);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token revoked, please login again',);
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }

}