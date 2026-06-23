# UCE Smart Parking — Contexto Global del Agente

> Lee este archivo al inicio de CADA sesión. Nunca preguntes cosas que están aquí.
> Antes de tocar cualquier servicio, lee también su `.claude/<service>.md`.

---

## Proyecto

Sistema de gestión de estacionamientos universitarios (UCE). Monorepo NX. Microservicios NestJS + Frontend NextJS. Desplegado en AWS EC2 vía GitHub Actions → Docker Hub → Terraform.

---

## Stack

| Capa | Tecnología |
|---|---|
| Monorepo | NX |
| Backend | NestJS + TypeScript |
| ORM | Prisma (schema separado por servicio en `prisma/<service>/schema.prisma`) |
| Clientes generados | `generated/<service>-client/` |
| Frontend | NextJS 14 App Router |
| BD principal | PostgreSQL 16 |
| Cache | Redis 7 |
| Mensajería | Kafka (KRaft, sin Zookeeper) |
| BD analytics | MongoDB (pendiente) |
| Cloud | AWS us-east-1 |
| IaC | Terraform |
| CI/CD | GitHub Actions → Docker Hub → EC2 vía Bastion SSH |

---

## Microservicios — Puertos y Bases de Datos

| Servicio | Puerto | BD | Estado |
|---|---|---|---|
| auth-service | 3000 | smartparking (PostgreSQL) | ✅ |
| user-service | 3001 | userdb (PostgreSQL) | ✅ |
| frontend | 3002 | — | ✅ |
| vehicle-service | 3003 | vehicledb (PostgreSQL) | ✅ |
| parking-service | 3004 | parkingdb (PostgreSQL) | ✅ |
| reservation-service | 3005 | reservationdb (PostgreSQL) | ✅ |
| gateway-service | 3006 | Redis only | ✅ |
| payment-service | 3007 | paymentdb (PostgreSQL) | ❌ pendiente |
| notification-service | 3008 | — Redis only | ❌ pendiente |
| analytics-service | 3009 | MongoDB | ❌ pendiente |

---

## Roles

```typescript
enum Role { ADMIN = 'ADMIN', STUDENT = 'STUDENT', PROFESSOR = 'PROFESSOR', GUEST = 'GUEST' }
```

---

## Secrets compartidos (mismo valor en TODOS los servicios)

| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Validar tokens JWT en todos los servicios |
| `INTERNAL_SERVICE_KEY` | Header `x-service-key` para llamadas HTTP internas |
| `REDIS_URL` | `redis://redis:6379` |
| `KAFKA_BROKERS` | `kafka:29092` (docker) / IP privada (EC2) |

---

## Comunicación entre servicios

**REST público:** Cliente → Gateway (3006) → Servicio

Gateway rutea por prefijo:
- `/auth/*` → auth:3000 — **sin JWT** (login, register)
- `/users/*` → user:3001 — con JWT
- `/vehicles/*` → vehicle:3003 — con JWT
- `/parking/*` → parking:3004 — con JWT
- `/reservations/*` → reservation:3005 — con JWT

Gateway inyecta headers downstream:
```
x-user-id, x-user-email, x-user-role
```

**REST interno:** Entre servicios directamente, sin pasar por gateway.
- Endpoint bajo `/api/internal/*`
- Header requerido: `x-service-key: <INTERNAL_SERVICE_KEY>`
- Guard: `ServiceKeyGuard`

**Kafka topics activos:**
- `slot.reserved` / `slot.occupied` / `slot.released` — parking produce
- `reservation.cancelled` / `reservation.expired` / `reservation.checkout` — reservation produce, parking consume

**Kafka topics pendientes:**
- `payment.completed` / `payment.failed` — payment produce
- `notification.send` — cualquier servicio produce, notification consume

---

## Estructura estándar de cada servicio (NO cambiar)

```
apps/<service>/
├── dockerfile
├── project.json
└── src/
    ├── main.ts                    ← GlobalPrefix('/api'), Swagger, ValidationPipe, cors
    └── app/
        ├── app.module.ts          ← ConfigModule con Joi validation, ThrottlerModule, todos los módulos
        ├── app.controller.ts
        ├── app.service.ts
        ├── <domain>/              ← lógica de negocio
        │   ├── <domain>.module.ts
        │   ├── <domain>.controller.ts
        │   ├── <domain>.service.ts
        │   ├── <domain>.service.spec.ts
        │   └── dto/
        ├── auth/
        │   ├── strategies/jwt.strategy.ts
        │   ├── guards/jwt-auth.guard.ts
        │   ├── guards/roles.guard.ts
        │   ├── guards/service-key.guard.ts
        │   ├── decorators/roles.decorator.ts
        │   └── enums/role.enum.ts
        ├── audit/audit.module.ts + audit.service.ts
        ├── filters/http-exception.filter.ts
        ├── health/health.controller.ts     ← GET /health
        ├── interceptors/transform-response.interceptor.ts
        ├── kafka/                          ← solo si usa Kafka
        ├── logger/logger.config.ts
        ├── metrics/metrics.module/controller/service
        ├── middlewares/request-logger + metrics
        └── redis/redis.module + redis.service
    └── infrastructure/database/
        ├── prisma.module.ts
        └── prisma.service.ts
```

---

## Prisma — cómo funciona en este proyecto

Cada servicio tiene:
- Schema: `smart-parking/prisma/<service>/schema.prisma`
- Config: `smart-parking/prisma.<service>.config.ts`
- Cliente generado: `smart-parking/generated/<service>-client/`

Comandos:
```bash
# Generar cliente
cd smart-parking && npx prisma generate --config prisma.<service>.config.ts

# Migrar
cd smart-parking && npx prisma migrate dev --config prisma.<service>.config.ts --name init
```

---

## Modelos de datos reales (Prisma)

**auth** → User(id, email, password[argon2], role, isActive, isVerified), RefreshToken, AuditLog
**user** → UserProfile(id, authUserId[unique], firstName, lastName, phone, avatar, role, isActive)
**vehicle** → Vehicle(id, authUserId[unique], registrationNumber, plate, color, model, year)
**parking** → Faculty(id,name,code) → Zone(id,name,code,centerLat,centerLng,facultyId) → Slot(id,number,status[AVAILABLE|RESERVED|OCCUPIED|MAINTENANCE|DISABLED],lat,lng,zoneId,facultyId)
**reservation** → Reservation(id,userId,vehicleId,slotId,reservationCode[8chars],status[PENDING|ACTIVE|COMPLETED|EXPIRED|CANCELLED],reservedAt,expiresAt[15min],checkInAt,checkOutAt,durationMinutes,cancelledAt)

---

## Comandos NX

```bash
cd smart-parking

# Servir
npx nx serve <service>

# Build
npx nx build <service>

# Test
npx nx test <service>

# Build todos (excepto frontend)
npx nx run-many --target=build --all --exclude=frontend --parallel=3

# Test todos
npx nx run-many --target=test --all --parallel=3 --coverage
```

---

## Infraestructura QA

- 8 EC2 t3.micro (1 por servicio)
- Solo gateway y frontend tienen EIP (IP pública fija)
- Los demás están en subnet pública pero con IP dinámica, acceso solo vía gateway o Bastion SSH
- PostgreSQL + Redis + Kafka corren en docker-compose dentro de las EC2 (no managed — OK para QA)
- Deploy: GitHub Actions → SSH al Bastion → SSH interno → `docker pull && docker run`

---

## Convenciones

```
feat(payment): add payment service base structure
fix(parking): correct slot availability race condition
chore(infra): add payment-service EC2 to terraform
test(reservation): add integration test for create flow
docs(auth): add swagger decorators to all endpoints
```

---

## Reglas para el agente

1. **Antes de tocar un servicio** → leer `.claude/<service>.md`
2. **No inventar patrones nuevos** → seguir exactamente la estructura que tienen auth, parking, reservation
3. **No usar `@prisma/client` global** → cada servicio tiene su propio cliente generado
4. **Siempre GlobalPrefix('/api')** en main.ts
5. **Nunca hardcodear URLs** → usar ConfigService
6. **Siempre ServiceKeyGuard** en endpoints `/api/internal/*`
7. **Validar env vars con Joi** en app.module.ts como lo hace auth-service