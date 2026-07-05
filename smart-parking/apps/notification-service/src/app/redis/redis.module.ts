import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppRedisService } from './redis.service';

@Module({
    imports: [
        RedisModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'single',
                url: configService.get<string>('REDIS_URL'),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AppRedisService],
    exports: [AppRedisService],
})
export class AppRedisModule { }