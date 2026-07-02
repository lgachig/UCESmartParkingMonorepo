import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { InternalUsersController } from './internal-users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AppRedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, AppRedisModule],
  controllers: [UsersController, InternalUsersController],
  providers: [UsersService],
})
export class UserModule {}
