# Payment Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio AÚN NO EXISTE. Debes crearlo siguiendo el patrón estándar.

---

## Estado: ❌ PENDIENTE — Crear desde cero

Puerto: `3007` | BD: `paymentdb` (PostgreSQL) | Kafka: ✅ producer + consumer

---

## Lo que hace

Procesa pagos de reservaciones. En QA simula el procesamiento (siempre exitoso). Al completar un pago, produce un evento Kafka que reservation-service consume para activar la reservación. Sin payment-service, las reservaciones quedan en estado PENDING para siempre.

**Flujo completo:**
1. Usuario crea reservación → status PENDING
2. Frontend llama `POST /api/payments` con el reservationId
3. payment-service simula procesamiento → status COMPLETED
4. Produce evento `payment.completed` a Kafka
5. reservation-service consume el evento → cambia reservación a ACTIVE
6. parking-service recibe confirmación → slot pasa a OCCUPIED

---

## Endpoints a implementar

```
POST /api/payments                          → crear pago (requiere JWT)
GET  /api/payments/:id                      → consultar pago (requiere JWT)
GET  /api/payments/reservation/:reservationId → pago de una reservación (requiere JWT)
GET  /api/payments/my                       → mis pagos (requiere JWT)
GET  /api/payments/admin/all                → todos los pagos (ADMIN only)

# Interno
POST /api/internal/payments/verify/:reservationId → verificar si reservación fue pagada
```

---

## Kafka

**Produce:**
- `payment.completed` → pago exitoso
  ```json
  { "paymentId": "uuid", "reservationId": "uuid", "userId": "uuid", "amount": 2.50, "status": "COMPLETED" }
  ```
- `payment.failed` → pago fallido (no aplica en QA pero preparar el topic)

**Consume:**
- No consume en esta fase. En PROD consumiría confirmaciones de pasarela externa.

---

## Variables de entorno

```env
PORT=3007
DATABASE_URL=postgresql://admin:admin@postgres:5432/paymentdb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
INTERNAL_SERVICE_KEY=internal_service_secret_key
CORS_ORIGINS=http://localhost:3002
RESERVATION_SERVICE_URL=http://reservation-service:3005
```

---

## Prisma schema a crear

Archivo: `smart-parking/prisma/payment/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../generated/payment-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Payment {
  id            String        @id @default(uuid())
  reservationId String        @map("reservation_id")
  userId        String        @map("user_id")
  amount        Decimal       @db.Decimal(10, 2)
  currency      String        @default("USD")
  status        PaymentStatus @default(PENDING)
  method        String        @default("SIMULATED")
  reference     String?       @unique         // "PAY-XXXXXXXX"
  processedAt   DateTime?     @map("processed_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt      @map("updated_at")

  @@map("payments")
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

---

## Lógica de simulación (QA)

```typescript
// payments.service.ts
async createPayment(dto: CreatePaymentDto, userId: string): Promise<Payment> {
  // 1. Verificar que la reservación existe y está PENDING
  //    → GET reservation-service:3005/api/internal/reservations/:id
  // 2. Generar reference: "PAY-" + 8 chars random
  // 3. Crear Payment con status PENDING
  // 4. Simular procesamiento (siempre exitoso en QA)
  // 5. Actualizar status a COMPLETED, setear processedAt
  // 6. Producir evento Kafka payment.completed
  // 7. Retornar pago
}
```

---

## DTOs a crear

```typescript
// create-payment.dto.ts
export class CreatePaymentDto {
  @IsUUID() reservationId: string
  @IsNumber() @Min(0.01) amount: number
  @IsOptional() @IsString() method?: string  // default: "SIMULATED"
}

// payment-response.dto.ts
export class PaymentResponseDto {
  id: string
  reservationId: string
  userId: string
  amount: number
  currency: string
  status: PaymentStatus
  method: string
  reference?: string
  processedAt?: Date
  createdAt: Date
}
```

---

## Módulos a crear (estructura estándar)

```
apps/payment-service/src/app/
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts        ← endpoints públicos (JWT)
│   ├── payments.controller.spec.ts
│   ├── payments-internal.controller.ts ← /api/internal/payments/*
│   ├── payments.service.ts
│   ├── payments.service.spec.ts
│   └── dto/
│       ├── create-payment.dto.ts
│       └── payment-response.dto.ts
├── kafka/
│   ├── kafka.module.ts
│   └── kafka.service.ts              ← solo producer (no consumer en fase inicial)
└── reservation-client/
    ├── reservation-client.module.ts
    └── reservation-client.service.ts ← HTTP a reservation-service para validar
```

---

## Cambios en otros servicios

### reservation-service — añadir consumer de Kafka
Cuando payment-service esté listo, añadir en `reservation-service/kafka/kafka-consumer.service.ts`:
```typescript
// Consumir payment.completed
// Buscar reservación por reservationId del evento
// Cambiar status PENDING → ACTIVE
```

### gateway-service — añadir ruta
En `proxy.module.ts` añadir:
```typescript
'/payments': {
  target: process.env.PAYMENT_SERVICE_URL,  // http://payment-service:3007
  changeOrigin: true,
}
```

### gateway-service — añadir env var
```env
PAYMENT_SERVICE_URL=http://payment-service:3007
```

### frontend — añadir flujo de pago
En `user/reservations/page.tsx`: después de crear reservación → modal de pago → llamar `POST /api/payments`

---

## Infraestructura a crear

### docker-compose.yml — añadir
```yaml
payment-service:
  build:
    context: ./smart-parking
    dockerfile: apps/payment-service/dockerfile
  container_name: smartparking-payment
  ports:
    - "3007:3007"
  environment:
    PORT: 3007
    DATABASE_URL: postgresql://admin:admin@postgres:5432/paymentdb
    JWT_SECRET: ${JWT_SECRET}
    REDIS_URL: redis://redis:6379
    KAFKA_BROKERS: kafka:29092
    INTERNAL_SERVICE_KEY: ${INTERNAL_SERVICE_KEY}
    RESERVATION_SERVICE_URL: http://reservation-service:3005
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
    kafka:
      condition: service_started
  networks:
    - smartparking-network
```

### postgres-init.sql — añadir
```sql
CREATE DATABASE paymentdb;
```

### Terraform QA — añadir módulo EC2
En `infra/terraform/environments/qa/main.tf`:
```hcl
module "payment_service" {
  source        = "../../modules/ec2"
  service_name  = "payment"
  instance_type = var.instance_type
  subnet_id     = module.vpc.public_subnet_ids[0]
  security_group_ids = [module.security_groups.payment_sg_id]
  key_name      = var.key_name
  docker_image  = "${var.dockerhub_user}/smartparking-payment"
  docker_image_tag = "qa"
  service_port  = 3007
  environment_vars = {
    PORT                  = "3007"
    DATABASE_URL          = "postgresql://..."
    JWT_SECRET            = var.jwt_secret
    REDIS_URL             = "redis://${module.redis_instance.private_ip}:6379"
    KAFKA_BROKERS         = "${module.kafka_instance.private_ip}:9092"
    INTERNAL_SERVICE_KEY  = var.internal_service_key
    RESERVATION_SERVICE_URL = "http://${module.reservation_service.private_ip}:3005"
  }
  tags = { Environment = "qa", Service = "payment" }
}
```

### GitHub Actions qa.yml — añadir
En el job `docker-push`, añadir:
```yaml
- name: Build and push payment-service
  uses: docker/build-push-action@v5
  with:
    context: ./smart-parking
    file: ./smart-parking/apps/payment-service/dockerfile
    push: true
    tags: ${{ secrets.DOCKERHUB_USERNAME }}/smartparking-payment:qa
```

En el job `deploy`, añadir payment en la matrix de servicios.
