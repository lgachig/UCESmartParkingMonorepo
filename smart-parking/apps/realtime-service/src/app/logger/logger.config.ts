import { utilities } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');

export const winstonConfig = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
    ),
    defaultMeta: { service: 'realtime-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                utilities.format.nestLike('RealtimeService'),
            ),
        }),
        new winston.transports.File({
            filename: join(logsDir, 'realtime-service.log'),
            maxsize: 5_242_880,
            maxFiles: 5,
        }),
    ],
});