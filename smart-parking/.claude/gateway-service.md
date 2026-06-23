# Gateway Service — Contexto del Agente

> Lee CLAUDE.md global primero, luego este archivo.
> Este servicio YA ESTÁ IMPLEMENTADO.

---

## Estado: ✅ COMPLETO

Puerto: `3006` | Sin BD propia | Redis para blacklist de tokens | Sin Kafka

---

## Lo que hace

Es el único punto de entrada público del sistema. Actúa como proxy reverso: recibe todas las peticiones del frontend, valida el JWT, inyecta los headers del usuario, y redirige al microservicio correcto. También aplica rate limiting global.

**El frontend apunta TODO al gateway.** No llama a los servicios directamente.

---

## Cómo rutea

```
POST /auth/*       → auth-service:3000   (SIN JWT — login/register son públicos)
GET  /users/*      → user-service:3001   (CON JWT)
GET  /vehicles/*   → vehicle-service:3003 (CON JWT)
GET  /parking/*    → parking-service:3004 (CON JWT)  [GET sin JWT para nearby]
GET  /reservations/* → reservation-service:3005 (CON JWT)
```

**Headers inyectados downstream en cada request:**
```
x-user-id:    <userId del JWT>
x-user-email: <email del JWT>
x-user-role:  <role del JWT>
```

---

## Guards en el gateway

- `JwtGatewayGuard` — valida el JWT, extrae claims, inyecta headers
- `ThrottleGuard` — 60 req/min por IP (configurable)

Rutas excluidas del JWT: `/api/auth/*`, `/health`, `/metrics`

---

## Variables de entorno

```env
GATEWAY_PORT=3006
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
AUTH_SERVICE_URL=http://auth-service:3000
USER_SERVICE_URL=http://user-service:3001
VEHICLE_SERVICE_URL=http://vehicle-service:3003
PARKING_SERVICE_URL=http://parking-service:3004
RESERVATION_SERVICE_URL=http://reservation-service:3005
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
CORS_ORIGINS=http://localhost:3002
INTERNAL_SERVICE_KEY=internal_service_secret_key
```

---

## Cuándo actualizar este servicio

Cada vez que se añade un microservicio nuevo (payment, notification, analytics), hay que:
1. Añadir la URL en las variables de entorno
2. Añadir la ruta en `proxy.module.ts`
3. Decidir si requiere JWT o no

**Actualización para payment-service:**
```typescript
// proxy.module.ts
'/payments': {
  target: configService.get('PAYMENT_SERVICE_URL'),
  changeOrigin: true,
  pathRewrite: { '^/payments': '/api/payments' },
}
```

---

## Tests pendientes

- `gateway.proxy.spec.ts` ❌ — CREAR
- `jwt-gateway.guard.spec.ts` ❌ — CREAR

---

## Historial de implementación (para Huly)

1. Generado con Nx generate
2. ProxyModule con http-proxy-middleware
3. JwtGatewayGuard (valida JWT_SECRET, inyecta headers x-user-*)
4. ThrottlerModule configurado
5. Rutas públicas: /api/auth/*, /health, /metrics
6. Dockerfile con EIP (IP pública fija en Terraform)
