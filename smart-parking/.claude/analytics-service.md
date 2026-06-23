# Analytics Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio AÚN NO EXISTE. Es el que introduce MongoDB al sistema.

---

## Estado: ❌ PENDIENTE — Crear desde cero

Puerto: `3009` | BD: MongoDB | Kafka: ✅ consumer (todos los eventos)

---

## Lo que hace

Consume todos los eventos Kafka del sistema y los almacena en MongoDB para análisis histórico. Expone endpoints de estadísticas agregadas para el dashboard de admin. Es el que justifica el requerimiento académico de **3 tecnologías de BD** (PostgreSQL + Redis + MongoDB).

---

## Endpoints a implementar

```
# ADMIN only (JwtAuthGuard + RolesGuard ADMIN)
GET /api/analytics/occupancy                → ocupación actual por zona
GET /api/analytics/reservations/daily       → reservaciones por día (últimos 30 días)
GET /api/analytics/reservations/hourly      → distribución por hora del día
GET /api/analytics/top-slots                → top 10 slots más usados
GET /api/analytics/revenue/daily            → ingresos por día
GET /api/analytics/revenue/total            → ingresos totales
GET /api/analytics/users/activity           → usuarios más activos

GET /health   → incluye estado de MongoDB
GET /metrics  → Prometheus
```

---

## Kafka — lo que consume

| Topic | Qué almacena |
|---|---|
| `slot.reserved` | evento de reserva en `slot_events` |
| `slot.occupied` | evento de ocupación |
| `slot.released` | evento de liberación |
| `reservation.cancelled` | evento en `reservation_events` |
| `reservation.expired` | evento |
| `payment.completed` | evento en `payment_events` |

---

## Variables de entorno

```env
PORT=3009
MONGODB_URI=mongodb://mongodb:27017/smartparking_analytics
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
INTERNAL_SERVICE_KEY=internal_service_secret_key
CORS_ORIGINS=http://localhost:3002
```

---

## Mongoose schemas a crear

```typescript
// schemas/slot-event.schema.ts
@Schema({ timestamps: true, collection: 'slot_events' })
export class SlotEvent {
  @Prop({ required: true }) eventType: string    // 'slot.reserved' | 'slot.occupied' | 'slot.released'
  @Prop({ required: true }) slotId: string
  @Prop() zoneId: string
  @Prop() facultyId: string
  @Prop() userId: string
  @Prop() reservationId: string
  @Prop({ type: Object }) metadata: Record<string, any>
}

// schemas/reservation-event.schema.ts
@Schema({ timestamps: true, collection: 'reservation_events' })
export class ReservationEvent {
  @Prop({ required: true }) eventType: string
  @Prop({ required: true }) reservationId: string
  @Prop() userId: string
  @Prop() slotId: string
  @Prop() reservationCode: string
  @Prop({ type: Object }) metadata: Record<string, any>
}

// schemas/payment-event.schema.ts
@Schema({ timestamps: true, collection: 'payment_events' })
export class PaymentEvent {
  @Prop({ required: true }) paymentId: string
  @Prop({ required: true }) reservationId: string
  @Prop({ required: true }) userId: string
  @Prop() amount: number
  @Prop() status: string
}
```

---

## Estructura a crear

```
apps/analytics-service/src/app/
├── analytics/
│   ├── analytics.module.ts
│   ├── analytics.controller.ts        ← endpoints de estadísticas (ADMIN)
│   ├── analytics.service.ts           ← queries MongoDB con Mongoose
│   ├── analytics.service.spec.ts
│   └── dto/
│       └── analytics-query.dto.ts     ← dateFrom, dateTo, zoneId, limit
├── schemas/
│   ├── slot-event.schema.ts
│   ├── reservation-event.schema.ts
│   └── payment-event.schema.ts
├── kafka/
│   ├── kafka.module.ts
│   └── kafka-consumer.service.ts      ← consume todos los topics y persiste en MongoDB
└── infrastructure/
    └── database/
        └── mongodb.module.ts          ← MongooseModule.forRootAsync(...)
```

**IMPORTANTE:** Este servicio usa Mongoose en lugar de Prisma. No tiene `prisma.service.ts`.

Instalar en workspace:
```bash
cd smart-parking && npm install @nestjs/mongoose mongoose
```

---

## Health check — incluir MongoDB

```typescript
// health.controller.ts
@Get('/health')
async health() {
  const mongoState = this.mongoConnection.readyState  // 1 = connected
  return {
    status: mongoState === 1 ? 'ok' : 'error',
    mongodb: mongoState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  }
}
```

---

## Infraestructura a crear

### docker-compose.yml — añadir MongoDB + analytics-service

```yaml
mongodb:
  image: mongo:7
  container_name: smartparking-mongodb
  ports:
    - "27017:27017"
  volumes:
    - mongodb_data:/data/db
  networks:
    - smartparking-network
  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
    interval: 10s
    timeout: 5s
    retries: 5

analytics-service:
  build:
    context: ./smart-parking
    dockerfile: apps/analytics-service/dockerfile
  container_name: smartparking-analytics
  ports:
    - "3009:3009"
  environment:
    PORT: 3009
    MONGODB_URI: mongodb://mongodb:27017/smartparking_analytics
    JWT_SECRET: ${JWT_SECRET}
    REDIS_URL: redis://redis:6379
    KAFKA_BROKERS: kafka:29092
    INTERNAL_SERVICE_KEY: ${INTERNAL_SERVICE_KEY}
  depends_on:
    mongodb:
      condition: service_healthy
    kafka:
      condition: service_started
  networks:
    - smartparking-network

volumes:
  mongodb_data:
```

### Terraform QA — añadir 2 módulos EC2
1. `mongodb_instance` — EC2 con docker run de mongo:7
2. `analytics_service` — EC2 con el contenedor del servicio

### GitHub Actions qa.yml — añadir push y deploy de analytics-service

---

## Frontend — página de analytics (cuando este servicio esté listo)

Crear: `app/(dashboard)/admin/analytics/page.tsx`

Componentes a crear:
- `ReservationsChart` — línea de reservaciones por día (usar recharts)
- `OccupancyCard` — ocupación actual por zona
- `RevenueCard` — ingresos totales
- `TopSlotsTable` — tabla de slots más usados

Añadir entrada en `Sidebar.tsx` bajo el menú ADMIN.
