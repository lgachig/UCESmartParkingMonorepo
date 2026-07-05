import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { AuditModule } from '../audit/audit.module';
import { AppRedisService } from '../redis/redis.service';
import { AppRedisModule } from '../redis/redis.module';
import { UserClientModule } from '../user-client/user-client.module';
import { InternalAuthController } from './internal-auth.controller';

@Module({
  imports: [
    AuditModule,
    AppRedisModule,
    UserClientModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [AuthController, InternalAuthController],
  providers: [AuthService,
    JwtStrategy,
    RolesGuard,
    AppRedisService
  ],
})
export class AuthModule { }
