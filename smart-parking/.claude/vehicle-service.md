# Vehicle Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio YA ESTÁ IMPLEMENTADO.

---

## Estado: ✅ COMPLETO (faltan unit tests)

Puerto: `3003` | BD: `vehicledb` (PostgreSQL) | Sin Kafka

---

## Lo que hace

Registra y gestiona los vehículos de cada usuario. Un usuario puede tener múltiples vehículos. reservation-service consulta este servicio internamente para validar que el vehículo pertenece al usuario antes de crear una reservación.

---

## Endpoints

```
# Internos (ServiceKeyGuard)
GET /api/internal/vehicles/:vehicleId    → obtener vehículo por id
GET /api/internal/vehicles/user/:authUserId → vehículos de un usuario

# Protegidos con JWT
GET  /api/vehicles                        → mis vehículos (del usuario autenticado)
POST /api/vehicles                        → registrar vehículo
GET  /api/vehicles/:id                    → obtener vehículo
PUT  /api/vehicles/:id                    → actualizar vehículo
DELETE /api/vehicles/:id                  → eliminar vehículo
```

---

## Variables de entorno

```env
VEHICLE_SERVICE_PORT=3003
VEHICLE_DATABASE_URL=postgresql://admin:admin@postgres:5432/vehicledb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
INTERNAL_SERVICE_KEY=internal_service_secret_key
CORS_ORIGINS=http://localhost:3002
```

---

## Prisma schema

```prisma
model Vehicle {
  id                 String   @id @default(uuid())
  authUserId         String   @unique   // un vehículo por usuario (actualmente)
  registrationNumber String
  plate              String
  color              String
  model              String
  year               Int
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@map("vehicles")
}
```

---

## Tests pendientes

- `vehicles.service.spec.ts` ❌ — CREAR
- `vehicles.controller.spec.ts` ❌ — CREAR

---

## Frontend que consume este servicio

Service: `services/` (inferido)
Páginas: `user/vehicle/` — registrar/ver/editar vehículo

---

## Historial de implementación (para Huly)

1. Generado con Nx generate
2. Prisma schema con Vehicle → cliente en `generated/vehicle-client/`
3. DTOs: vehicle.dto.ts (create + update)
4. InternalController para que reservation-service valide vehículos
5. VehiclesController para operaciones del usuario
6. Dockerfile
7. ⚠️ Sin unit tests — pendiente
