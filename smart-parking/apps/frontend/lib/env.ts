function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Copy .env.example to .env.local`,
    );
  }
  return value;
}

export const env = {
  authApiUrl: requireEnv(
    'NEXT_PUBLIC_AUTH_API_URL',
    process.env.NEXT_PUBLIC_AUTH_API_URL,
  ),
  userApiUrl: requireEnv(
    'NEXT_PUBLIC_USER_API_URL',
    process.env.NEXT_PUBLIC_USER_API_URL,
  ),
  vehicleApiUrl: requireEnv(
    'NEXT_PUBLIC_VEHICLE_API_URL',
    process.env.NEXT_PUBLIC_VEHICLE_API_URL,
  ),
  parkingApiUrl: requireEnv(
    'NEXT_PUBLIC_PARKING_API_URL',
    process.env.NEXT_PUBLIC_PARKING_API_URL,
  ),
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
