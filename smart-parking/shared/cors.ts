import type { ConfigService } from '@nestjs/config';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3002',
];

export function getCorsOrigins(configService: ConfigService): string[] {
  const extra = configService.get<string>('CORS_ORIGINS');
  const fromEnv = extra
    ? extra
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return [...new Set([...DEFAULT_CORS_ORIGINS, ...fromEnv])];
}

export function applyCors(
  app: { enableCors: (options: object) => void },
  configService: ConfigService,
): void {
  app.enableCors({
    origin: getCorsOrigins(configService),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-service-key'],
  });
}
