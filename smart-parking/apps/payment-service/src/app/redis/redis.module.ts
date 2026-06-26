import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppRedisService } from './redis.service';

@Module({
  imports: [
    ConfigModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL'),
      }),
    }),
  ],
  providers: [AppRedisService],
  exports: [RedisModule, AppRedisService],
})
export class AppRedisModule {}
