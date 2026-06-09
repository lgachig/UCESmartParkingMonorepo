import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class AppRedisService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
      return;
    }
    await this.redis.set(key, value);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async delete(key: string) {
    return this.redis.del(key);
  }

  async isBlacklisted(token: string) {
    const res = await this.redis.get(`blacklist:${token}`);
    return !!res;
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
