# User Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio YA ESTÁ IMPLEMENTADO.

---

## Estado: ✅ COMPLETO

Puerto: `3001` | BD: `userdb` (PostgreSQL) | Sin Kafka

---

## Lo que hace

Almacena perfiles extendidos de usuarios (nombre, teléfono, avatar). El perfil se crea automáticamente cuando auth-service registra un usuario nuevo. No maneja autenticación — confía en los headers que inyecta el gateway (`x-user-id`, `x-user-role`).

---

## Endpoints

```
# Públicos para servicios internos
POST /api/internal/profile               → crea perfil (llamado por auth-service al register)
GET  /api/internal/profile/:authUserId   → obtener perfil por authUserId

# Protegidos con JWT (via gateway)
GET  /api/users/me                       → perfil del usuario autenticado
PUT  /api/users/me                       → actualizar mi perfil
GET  /api/users                          → listar usuarios (ADMIN only)
GET  /api/users/:id                      → obtener usuario por id (ADMIN only)
PUT  /api/users/:id/status               → activar/desactivar usuario (ADMIN only)
```

---

## Variables de entorno

```env
USER_SERVICE_PORT=3001
USER_DATABASE_URL=postgresql://admin:admin@postgres:5432/userdb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
INTERNAL_SERVICE_KEY=internal_service_secret_key
CORS_ORIGINS=http://localhost:3002
```

---

## Prisma schema

```prisma
model UserProfile {
  id         String   @id @default(uuid())
  authUserId String   @unique       // FK lógica a auth-service User.id
  firstName  String?
  lastName   String?
  phone      String?
  avatar     String?
  role       String   @default("STUDENT")
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@map("user_profiles")
}
model AuditLog { ... }
```

---

## Tests existentes

- `users.service.spec.ts` ✅
- `users.controller.spec.ts` ✅

---

## Frontend que consume este servicio

Service: `services/user.service.ts`
Páginas: `user/settings/` (actualizar perfil), `admin/` (listar usuarios)

---

## Historial de implementación (para Huly)

1. Generado con Nx generate
2. Prisma schema con UserProfile → cliente en `generated/user-client/`
3. DTOs: create-user-profile.dto, update-user-profile.dto, search-users.dto
4. InternalController (ServiceKeyGuard) para que auth-service cree perfiles
5. UsersController (JwtAuthGuard) para operaciones autenticadas
6. Unit tests pasando
7. Dockerfile
