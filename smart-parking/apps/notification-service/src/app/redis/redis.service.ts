import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class AppRedisService {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
    ) { }

    async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
        const result = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    }

    async releaseLock(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async ping(): Promise<boolean> {
        try {
            const res = await this.redis.ping();
            return res === 'PONG';
        } catch {
            return false;
        }
    }
}