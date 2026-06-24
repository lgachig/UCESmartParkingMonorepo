# Notification Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio AÚN NO EXISTE. Debes crearlo siguiendo el patrón estándar.

---

## Estado: ❌ PENDIENTE — Crear desde cero

Puerto: `3008` | Sin BD propia | Redis para deduplicación | Kafka: ✅ consumer

---

## Lo que hace

Escucha eventos de Kafka y envía notificaciones a los usuarios. En QA registra las notificaciones en logs y en Redis. No tiene base de datos propia — es un servicio stateless que consume eventos y actúa. En PROD se conectaría a un proveedor de email (SendGrid, SES).

**Este servicio solo consume, no produce eventos.**

---

## Endpoints (mínimos)

```
GET /health   → estado del servicio + conexión Kafka + Redis
GET /metrics  → Prometheus metrics
```

No expone endpoints de negocio — es puramente event-driven.

---

## Kafka — lo que consume

| Topic | Acción |
|---|---|
| `payment.completed` | Notificar: "Tu pago fue procesado. Reservación activa." |
| `reservation.cancelled` | Notificar: "Tu reservación fue cancelada." |
| `reservation.expired` | Notificar: "Tu reservación expiró por falta de pago." |

Formato esperado de cada evento (lo que produce el otro servicio):

`payment.completed`:
```json
{ "paymentId": "uuid", "reservationId": "uuid", "userId": "uuid", "amount": 2.50 }
```

`reservation.cancelled` / `reservation.expired`:
```json
{ "reservationId": "uuid", "userId": "uuid", "slotId": "uuid", "reservationCode": "AB3X9K2P" }
```

---

## Variables de entorno

```env
PORT=3008
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
INTERNAL_SERVICE_KEY=internal_service_secret_key
# Para PROD (opcional en QA):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@uce.edu.ec
SMTP_PASS=...
FROM_EMAIL=noreply@uce.edu.ec
```

---

## Estructura a crear

```
apps/notification-service/src/app/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts      ← lógica de envío
│   └── notifications.service.spec.ts
├── kafka/
│   ├── kafka.module.ts
│   └── kafka-consumer.service.ts    ← consume los 3 topics
└── templates/
    ├── payment-completed.template.ts
    ├── reservation-cancelled.template.ts
    └── reservation-expired.template.ts
```

NO necesita: PrismaModule, JwtStrategy, RolesGuard (no tiene endpoints de negocio).
SÍ necesita: KafkaModule, RedisModule, MetricsModule, HealthModule, LoggerConfig.

---

## Lógica del consumer

```typescript
// kafka-consumer.service.ts
@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  
  async onModuleInit() {
    // Suscribirse a los 3 topics
    await this.consumer.subscribe({ topics: ['payment.completed', 'reservation.cancelled', 'reservation.expired'] })
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = JSON.parse(message.value.toString())
        
        // Deduplicar con Redis (evitar procesar el mismo evento 2 veces)
        const key = `notification:${topic}:${payload.reservationId || payload.paymentId}`
        const already = await this.redis.get(key)
        if (already) return
        await this.redis.set(key, '1', 'EX', 86400) // 24h TTL
        
        switch (topic) {
          case 'payment.completed':
            await this.notificationsService.sendPaymentConfirmation(payload)
            break
          case 'reservation.cancelled':
            await this.notificationsService.sendCancellationNotice(payload)
            break
          case 'reservation.expired':
            await this.notificationsService.sendExpirationNotice(payload)
            break
        }
      }
    })
  }
}
```

---

## NotificationsService en QA

```typescript
// En QA: log estructurado + guardar en Redis
async sendPaymentConfirmation(payload: PaymentCompletedEvent) {
  this.logger.log({
    type: 'NOTIFICATION',
    event: 'payment.completed',
    userId: payload.userId,
    message: `Pago ${payload.paymentId} procesado. Reservación ${payload.reservationId} activa.`,
    amount: payload.amount,
  })
  // Guardar en Redis para que el frontend pueda consultarlo luego
  await this.redis.lpush(`notifications:${payload.userId}`, JSON.stringify({
    type: 'payment_completed',
    message: `Tu pago de $${payload.amount} fue procesado exitosamente.`,
    createdAt: new Date().toISOString(),
  }))
}
```

---

## Infraestructura a crear

### docker-compose.yml — añadir
```yaml
notification-service:
  build:
    context: ./smart-parking
    dockerfile: apps/notification-service/dockerfile
  container_name: smartparking-notification
  ports:
    - "3008:3008"
  environment:
    PORT: 3008
    REDIS_URL: redis://redis:6379
    KAFKA_BROKERS: kafka:29092
    INTERNAL_SERVICE_KEY: ${INTERNAL_SERVICE_KEY}
  depends_on:
    redis:
      condition: service_healthy
    kafka:
      condition: service_started
  networks:
    - smartparking-network
```

### Terraform QA — añadir módulo EC2
Igual al patrón de los otros servicios, puerto 3008. Sin DATABASE_URL (no tiene BD).

### GitHub Actions qa.yml — añadir push y deploy de notification-service
