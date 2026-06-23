# Auth Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio YA ESTÁ IMPLEMENTADO. Úsalo como referencia de patrón.

---

## Estado: ✅ COMPLETO

Puerto: `3000` | BD: `smartparking` (PostgreSQL) | Sin Kafka

---

## Lo que hace

Gestiona autenticación y sesiones. Es el único servicio que crea usuarios en el sistema. Al registrar un usuario, llama internamente a user-service para crear el perfil extendido.

---

## Endpoints

```
POST /api/auth/register          → crea User + llama user-service /api/internal/profile
POST /api/auth/login             → retorna { accessToken, refreshToken, user }
POST /api/auth/refresh           → rota refreshToken, retorna nuevo par
POST /api/auth/logout            → invalida refreshToken en Redis
POST /api/auth/forgot-password   → genera reset token (guardado en Redis, TTL 1h)
POST /api/auth/reset-password    → valida token y cambia password
POST /api/auth/change-password   → cambia password con password actual
```

Todos los endpoints son **públicos** (no requieren JWT). El JWT lo emite este servicio.

---

## Módulos propios (adicionales a la estructura estándar)

- `user-client/` → HTTP client para llamar a user-service al registrar
  - URL: `USER_SERVICE_URL/api/internal/profile`
  - Header: `x-service-key: INTERNAL_SERVICE_KEY`

---

## Variables de entorno

```env
PORT=3000
DATABASE_URL=postgresql://admin:admin@postgres:5432/smartparking
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
REDIS_URL=redis://redis:6379
USER_SERVICE_URL=http://user-service:3001
INTERNAL_SERVICE_KEY=internal_service_secret_key
CORS_ORIGINS=http://localhost:3002
FRONTEND_URL=http://localhost:3002
```

---

## Prisma schema

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String         // argon2 hash
  role          Role           @default(STUDENT)
  isActive      Boolean        @default(true)
  isVerified    Boolean        @default(false)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
}
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  expiresAt DateTime
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
model AuditLog {
  id         String   @id @default(uuid())
  action     String
  userId     String?
  email      String?
  ipAddress  String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())
}
enum Role { ADMIN STUDENT PROFESSOR GUEST }
```

---

## Tests existentes

- `auth.service.spec.ts` ✅ — register, login, refresh, logout
- `auth.controller.spec.ts` ✅ — todos los endpoints

---

## Frontend que consume este servicio

Páginas: `app/(auth)/login/`
Componentes: `LoginForm.tsx`, `LoginHero.tsx`, `AuthPageLayout.tsx`
Librerías: `lib/schemas/login.schema.ts` (zod), `lib/api.ts` (axios instance)

El frontend guarda `accessToken` en memoria y `refreshToken` en httpOnly cookie.

---

## Historial de implementación (para Huly)

1. Generado con Nx generate
2. Prisma schema creado → cliente generado en `generated/auth-client/`
3. Módulos en orden: PrismaModule → RedisModule → AuditModule → AuthModule → UserClientModule → HealthModule → MetricsModule
4. JWT Strategy con RS256 usando JWT_SECRET
5. Refresh token con rotación almacenado en Redis (key: `refresh:<token>`, TTL: 7 días)
6. Password hasheado con argon2
7. UserClientModule llama a user-service para crear perfil al registrar
8. Unit tests pasando
9. Dockerfile: node:20-alpine, multi-stage build
