import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ServiceKeyGuard } from './guards/service-key.guard';
import { AppRedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    AppRedisModule,
  ],
  providers: [JwtStrategy, RolesGuard, ServiceKeyGuard],
  exports: [PassportModule, RolesGuard, ServiceKeyGuard],
})
export class AuthModule {}
