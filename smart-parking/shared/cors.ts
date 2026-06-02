import type { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3002',
];

/** QA Elastic IPs — update when Terraform outputs change */
const QA_CORS_ORIGINS = [
  'http://23.22.208.51:3002',
  'http://32.199.64.38:3000',
  'http://100.50.63.232:3001',
  'http://34.204.142.7:3003',
];

function parseOriginList(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsOrigins(configService: ConfigService): string[] {
  const fromCorsEnv = parseOriginList(configService.get<string>('CORS_ORIGINS'));
  const frontendUrl = configService.get<string>('FRONTEND_URL')?.trim();

  const origins = [
    ...DEFAULT_CORS_ORIGINS,
    ...QA_CORS_ORIGINS,
    ...fromCorsEnv,
    ...(frontendUrl ? [frontendUrl] : []),
  ];

  return [...new Set(origins)];
}

export function applyCors(
  app: { enableCors: (options: object) => void },
  configService: ConfigService,
): void {
  const allowedOrigins = getCorsOrigins(configService);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-service-key'],
  });
}

export function configureHelmet() {
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  });
}
