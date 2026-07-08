import type { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3002',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  'http://localhost:3007',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:5173'

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

/** HTTP-only deploy (EC2 sin TLS). Evita HSTS y upgrade-insecure-requests que rompen Swagger. */
export function configureHelmet() {
  return helmet({
    strictTransportSecurity: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  });
}
