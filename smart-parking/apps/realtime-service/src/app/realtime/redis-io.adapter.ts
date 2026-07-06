import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { getCorsOrigins } from '../../../../../shared/cors';

export class RedisIoAdapter extends IoAdapter {
    private readonly logger = new Logger(RedisIoAdapter.name);
    private adapterConstructor?: ReturnType<typeof createAdapter>;

    constructor(private readonly app: INestApplicationContext) {
        super(app);
    }

    async connectToRedis(): Promise<void> {
        const configService = this.app.get(ConfigService);
        const redisUrl = configService.get<string>('REDIS_URL')!;

        const pubClient = new Redis(redisUrl);
        const subClient = pubClient.duplicate();

        pubClient.on('error', (err) => this.logger.error('Redis pub client error', err));
        subClient.on('error', (err) => this.logger.error('Redis sub client error', err));

        this.adapterConstructor = createAdapter(pubClient, subClient);
        this.logger.log('Socket.IO Redis adapter connected (multi-instance scaling enabled)');
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const configService = this.app.get(ConfigService);
        const allowedOrigins = getCorsOrigins(configService);

        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: (
                    origin: string | undefined,
                    callback: (err: Error | null, allow?: boolean) => void,
                ) => {
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                        return;
                    }
                    callback(null, false);
                },
                credentials: true,
            },
        });

        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
        }

        return server;
    }
}