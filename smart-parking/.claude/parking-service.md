# Parking Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio YA ESTÁ IMPLEMENTADO. Es el más complejo del sistema.

---

## Estado: ✅ COMPLETO

Puerto: `3004` | BD: `parkingdb` (PostgreSQL) | Kafka: ✅ producer + consumer

---

## Lo que hace

Gestiona la estructura física del parqueadero: Facultades → Zonas → Slots. Controla el estado de cada slot en tiempo real. Es el que más eventos Kafka produce/consume porque cualquier cambio de ocupación pasa por aquí.

**Jerarquía:** Faculty → Zone → Slot

---

## Endpoints

```
# Públicos (no requieren JWT)
GET /api/parking/slots/nearby            → slots cercanos a coordenadas (lat, lng, radius)

# Internos (ServiceKeyGuard) — llamados por reservation-service
GET  /api/internal/slots/:slotId/availability  → verificar disponibilidad
POST /api/internal/slots/:slotId/reserve       → reservar slot (AVAILABLE → RESERVED)
POST /api/internal/slots/:slotId/release       → liberar slot (→ AVAILABLE)
POST /api/internal/slots/:slotId/occupy        → ocupar slot (→ OCCUPIED)

# Protegidos JWT — ADMIN
POST   /api/parking/faculties              → crear facultad
GET    /api/parking/faculties              → listar facultades
PUT    /api/parking/faculties/:id          → actualizar
DELETE /api/parking/faculties/:id          → eliminar

POST   /api/parking/zones                  → crear zona
GET    /api/parking/zones                  → listar zonas
PUT    /api/parking/zones/:id              → actualizar
DELETE /api/parking/zones/:id              → eliminar

POST   /api/parking/slots                  → crear slot
GET    /api/parking/slots                  → listar slots (con filtros: zoneId, status, facultyId)
GET    /api/parking/slots/:id              → obtener slot
PUT    /api/parking/slots/:id              → actualizar slot
DELETE /api/parking/slots/:id             → eliminar slot
PATCH  /api/parking/slots/:id/status      → cambiar status manualmente (ADMIN)

GET    /api/parking/statistics/global      → stats globales (total, available, occupied, reserved...)
GET    /api/parking/statistics/faculties   → stats por facultad
GET    /api/parking/statistics/zones       → stats por zona
```

---

## Kafka

**Produce:**
- `slot.reserved` → cuando un slot pasa a RESERVED
- `slot.occupied` → cuando un slot pasa a OCCUPIED
- `slot.released` → cuando un slot vuelve a AVAILABLE

**Consume:**
- `reservation.cancelled` → libera el slot (→ AVAILABLE)
- `reservation.expired` → libera el slot
- `reservation.checkout` → libera el slot

---

## Variables de entorno

```env
PARKING_SERVICE_PORT=3004
PARKING_DATABASE_URL=postgresql://admin:admin@postgres:5432/parkingdb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
INTERNAL_SERVICE_KEY=internal_service_secret_key
CORS_ORIGINS=http://localhost:3002
```

---

## Prisma schema

```prisma
model Faculty {
  id        Int      @id @default(autoincrement())
  name      String
  code      String   @unique
  zones     Zone[]
  slots     Slot[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
model Zone {
  id              Int      @id @default(autoincrement())
  name            String
  code            String   @unique
  centerLatitude  Float
  centerLongitude Float
  facultyId       Int
  faculty         Faculty  @relation(...)
  slots           Slot[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
model Slot {
  id        String     @id @default(uuid())
  number    String
  status    SlotStatus @default(AVAILABLE)
  latitude  Float
  longitude Float
  zoneId    Int
  zone      Zone       @relation(...)
  facultyId Int
  faculty   Faculty    @relation(...)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
enum SlotStatus { AVAILABLE RESERVED OCCUPIED MAINTENANCE DISABLED }
```

---

## Tests existentes

- `slots.service.spec.ts` ✅ — disponibilidad, reserva, liberación

---

## Frontend que consume este servicio

Service: `services/parking.service.ts`

Funciones implementadas:
- `getFaculties()`, `getZones()`, `getSlots()` con filtros
- `getSlotById()`, `getGlobalStats()`, `getFacultyStats()`
- `createFaculty()`, `updateFaculty()`, `deleteFaculty()`
- `createZone()`, `updateZone()`, `deleteZone()`
- `createSlot()`, `updateSlot()`, `deleteSlot()`, `updateSlotStatus()`

Páginas que usan este servicio:
- `admin/slots/` — CRUD completo con modales (SlotsPage, SlotsGrid, SlotCard, SlotModal, FacultyModal, ZoneModal)
- `user/` — MapView con Leaflet para ver slots en tiempo real
- `admin/reports/` — estadísticas globales y por facultad

---

## WebSocket pendiente (FASE 5)

Cuando se implemente WebSocket, este servicio debe emitir `slot:status:changed` cada vez que un slot cambie de estado. El gateway de WebSocket irá en este mismo servicio.

---

## Historial de implementación (para Huly)

1. Generado con Nx generate
2. Prisma schema Faculty/Zone/Slot → cliente en `generated/parking-client/`
3. Módulos: FacultiesModule, ZonesModule, SlotsModule, StatisticsModule
4. InternalSlotsController (ServiceKeyGuard) para reservation-service
5. KafkaModule con producer + consumer
6. Consumer escucha eventos de cancelación y libera slots
7. DTOs: faculty.dto, zone.dto, slot.dto
8. Unit tests slots.service.spec.ts
9. Dockerfile
