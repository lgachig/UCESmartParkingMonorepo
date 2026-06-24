# Reservation Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio YA ESTÁ IMPLEMENTADO. Es el que orquesta el flujo principal.

---

## Estado: ✅ COMPLETO

Puerto: `3005` | BD: `reservationdb` (PostgreSQL) | Kafka: ✅ producer + consumer

---

## Lo que hace

Orquesta el flujo completo de una reservación. Es el servicio más conectado: consulta parking-service (disponibilidad), vehicle-service (validar vehículo), user-service (validar usuario), y produce eventos Kafka. También tiene un cron job que expira reservaciones PENDING que llevan más de 15 minutos.

**Flujo de crear reservación:**
1. Verificar que el slot existe y está AVAILABLE → `GET parking:3004/api/internal/slots/:id/availability`
2. Verificar que el vehículo pertenece al usuario → `GET vehicle:3003/api/internal/vehicles/:vehicleId`
3. Crear Reservation con status PENDING y expiresAt = now + 15min
4. Reservar el slot → `POST parking:3004/api/internal/slots/:id/reserve`
5. Producir evento Kafka `slot.reserved`
6. Retornar reservación con reservationCode único (8 chars)

---

## Endpoints

```
# Internos (ServiceKeyGuard)
GET /api/internal/reservations/slot/:slotId  → reservación activa de un slot

# Protegidos JWT
POST   /api/reservations                     → crear reservación
GET    /api/reservations                     → mis reservaciones (usuario autenticado)
GET    /api/reservations/:id                 → obtener reservación
DELETE /api/reservations/:id                 → cancelar reservación (→ CANCELLED + libera slot)
POST   /api/reservations/:id/checkin        → check-in (ACTIVE → OCCUPIED)
POST   /api/reservations/:id/checkout       → check-out (→ COMPLETED + libera slot)

# ADMIN
GET    /api/reservations/admin/all           → todas las reservaciones
GET    /api/reservations/admin/stats         → estadísticas generales
```

---

## Kafka

**Produce:**
- `reservation.cancelled` → cuando usuario cancela
- `reservation.expired` → cuando el cron expira una reservación PENDING
- `reservation.checkout` → cuando usuario hace check-out

**Consume:**
- `payment.completed` → (pendiente) cambiará status de PENDING a ACTIVE

---

## Cron job

```typescript
@Cron('*/1 * * * *')  // cada 1 minuto
async expireReservations() {
  // Encuentra reservaciones PENDING con expiresAt < now
  // Las marca EXPIRED
  // Produce evento reservation.expired a Kafka
  // parking-service escucha y libera el slot
}
```

---

## Variables de entorno

```env
RESERVATION_SERVICE_PORT=3005
RESERVATION_DATABASE_URL=postgresql://admin:admin@postgres:5432/reservationdb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
INTERNAL_SERVICE_KEY=internal_service_secret_key
PARKING_SERVICE_URL=http://parking-service:3004
USER_SERVICE_URL=http://user-service:3001
VEHICLE_SERVICE_URL=http://vehicle-service:3003
RESERVATION_EXPIRY_MINUTES=15
CORS_ORIGINS=http://localhost:3002
```

---

## Prisma schema

```prisma
model Reservation {
  id              String            @id @default(uuid())
  userId          String            // authUserId del usuario
  vehicleId       String
  slotId          String
  reservationCode String            @unique  // 8 chars, ej: "AB3X9K2P"
  status          ReservationStatus @default(PENDING)
  reservedAt      DateTime          @default(now())
  expiresAt       DateTime          // reservedAt + 15 min
  checkInAt       DateTime?
  checkOutAt      DateTime?
  durationMinutes Int?
  cancelledAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}
enum ReservationStatus { PENDING ACTIVE COMPLETED EXPIRED CANCELLED }
```

---

## Tests existentes

- `reservations.service.spec.ts` ✅ — crear, cancelar, expirar

---

## Pendiente: integrar con payment-service

Cuando payment-service esté listo, este servicio debe:
1. Consumir `payment.completed` de Kafka
2. Cambiar la reservación de PENDING a ACTIVE al recibir el pago

---

## Frontend que consume este servicio

Service: `services/reservation.service.ts`
Páginas: `user/reservations/` — listar reservaciones, ver estado, cancelar

---

## Historial de implementación (para Huly)

1. Generado con Nx generate
2. Prisma schema Reservation → cliente en `generated/reservation-client/`
3. HttpClientModules para parking, vehicle y user services
4. ReservationsController + InternalReservationsController
5. Kafka producer + consumer
6. Cron job con `@nestjs/schedule` para expirar reservaciones
7. Generador de reservationCode único (8 chars alfanumérico)
8. DTOs: create-reservation.dto, update-reservation.dto
9. Unit tests reservations.service.spec.ts
10. Dockerfile
