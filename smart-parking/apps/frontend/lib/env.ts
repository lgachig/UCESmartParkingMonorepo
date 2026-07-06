function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Copy .env.example to .env.local`,
    );
  }
  return value;
}

const gatewayUrl = requireEnv(
  'NEXT_PUBLIC_GATEWAY_URL',
  process.env.NEXT_PUBLIC_GATEWAY_URL,
);

const realtimeUrl = requireEnv(
  'NEXT_PUBLIC_REALTIME_URL',
  process.env.NEXT_PUBLIC_REALTIME_URL,
);

export const env = {
  authApiUrl: gatewayUrl,
  userApiUrl: gatewayUrl,
  vehicleApiUrl: gatewayUrl,
  reservationApiUrl: gatewayUrl,
  paymentApiUrl: gatewayUrl,
  parkingApiUrl: `${gatewayUrl}/parking`,
  realtimeUrl,
  
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'UCE Smart Parking',
  routes: {
    admin: process.env.NEXT_PUBLIC_ROUTE_ADMIN ?? '/admin',
    student: process.env.NEXT_PUBLIC_ROUTE_STUDENT ?? '/user',
    professor: process.env.NEXT_PUBLIC_ROUTE_PROFESSOR ?? '/user',
    guest: process.env.NEXT_PUBLIC_ROUTE_GUEST ?? '/user',
  },
  storage: {
    accessToken:
      process.env.NEXT_PUBLIC_STORAGE_ACCESS_TOKEN ?? 'access_token',
    refreshToken:
      process.env.NEXT_PUBLIC_STORAGE_REFRESH_TOKEN ?? 'refresh_token',
    user: process.env.NEXT_PUBLIC_STORAGE_USER ?? 'user',
  },
} as const;

export type UserRole = 'ADMIN' | 'STUDENT' | 'PROFESSOR' | 'GUEST';

export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return env.routes.admin;
    case 'PROFESSOR':
      return env.routes.professor;
    case 'GUEST':
      return env.routes.guest;
    case 'STUDENT':
    default:
      return env.routes.student;
  }
}