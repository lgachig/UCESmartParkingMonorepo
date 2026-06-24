# HULY BOARD — UCE Smart Parking
## Plan completo con historial + tareas futuras

> **Cómo usar:** Cada task tiene un checkbox. Cuando termines, dime "listo el [TASK-ID]" y te confirmo el check ✅ y te indico el siguiente.
> En Huly: mueve el issue al estado correspondiente (Backlog / In Progress / Done).

---

## Cómo configurar Huly

1. Crear **Project**: `UCE Smart Parking`
2. Activar vista **Issues**
3. Crear **Milestones** (uno por fase)
4. **Labels**: `backend` `frontend` `infra` `devops` `testing` `docs` `kafka` `qa-blocker`
5. **Estados**: `Backlog → Todo → In Progress → In Review → Done`
6. Fase 0 = crear issues directo en **Done** (historial retroactivo)

---

# ══════════════════════════════════════════
# FASE 0 — HISTORIAL
# Todo esto YA SE HIZO → crear en Huly como Done
# ══════════════════════════════════════════

## Milestone: Fundación del Proyecto

### [HIST-01] Monorepo NX inicializado
**Labels:** `backend` `devops` | **Huly:** Done

Lo que se hizo y cómo debió hacerse:
- [x] `npx create-nx-workspace smart-parking --preset=empty`
- [x] Configurar `tsconfig.base.json`, `nx.json`, `jest.preset.js`
- [x] Añadir plugins: `@nx/nest`, `@nx/next`
- [x] `.prettierrc`, `.eslintrc.json` base
- [x] `package.json` con dependencias compartidas

---

### [HIST-02] Auth Service — Backend
**Labels:** `backend` | **Huly:** Done

Proceso completo que se siguió:
- [x] Generar: `npx nx generate @nx/nest:application auth-service`
- [x] Crear `prisma/auth/schema.prisma` con modelos User, RefreshToken, AuditLog
- [x] Generar cliente Prisma en `generated/auth-client/`
- [x] Implementar estructura estándar (filters, metrics, interceptors, logger, redis, audit, health, middlewares)
- [x] Implementar JWT Strategy + Guards (JwtAuthGuard, RolesGuard, ServiceKeyGuard)
- [x] Endpoints: register, login, refresh, logout, forgot-password, reset-password, change-password
- [x] Argon2 para hash de passwords
- [x] Refresh token con rotación en Redis (TTL 7 días)
- [x] UserClientService → llama `user-service:3001/api/internal/profile` al registrar
- [x] Unit tests: auth.service.spec.ts ✅, auth.controller.spec.ts ✅
- [x] Dockerfile (node:20-alpine, multi-stage)
- [x] Verificar: `npx nx build auth-service` sin errores
- [x] Verificar: `npx nx test auth-service` todos en verde

---

### [HIST-03] User Service — Backend
**Labels:** `backend` | **Huly:** Done

- [x] Generar con Nx
- [x] Prisma schema: UserProfile (authUserId único, firstName, lastName, phone, avatar)
- [x] InternalUsersController (ServiceKeyGuard) — `POST /api/internal/profile` para auth-service
- [x] UsersController (JwtAuthGuard) — CRUD del perfil propio, listado ADMIN
- [x] DTOs: create-user-profile, update-user-profile, search-users
- [x] Unit tests: users.service.spec.ts ✅, users.controller.spec.ts ✅
- [x] Dockerfile
- [x] Build y tests verificados

---

### [HIST-04] Vehicle Service — Backend
**Labels:** `backend` | **Huly:** Done

- [x] Generar con Nx
- [x] Prisma schema: Vehicle (plate, color, model, year, authUserId)
- [x] InternalVehiclesController (ServiceKeyGuard) — para que reservation-service valide vehículos
- [x] VehiclesController (JwtAuthGuard) — CRUD de vehículos del usuario
- [x] DTOs: vehicle.dto.ts
- [x] Dockerfile
- [x] Build verificado
- [x] ⚠️ Tests pendientes (TASK-TEST-01 lo cubre)

---

### [HIST-05] Parking Service — Backend
**Labels:** `backend` `kafka` | **Huly:** Done

- [x] Generar con Nx
- [x] Prisma schema: Faculty → Zone → Slot (con SlotStatus enum)
- [x] Módulos: FacultiesModule, ZonesModule, SlotsModule, StatisticsModule
- [x] InternalSlotsController (ServiceKeyGuard): availability, reserve, release, occupy
- [x] Kafka producer: slot.reserved, slot.occupied, slot.released
- [x] Kafka consumer: reservation.cancelled, reservation.expired, reservation.checkout → libera slot
- [x] StatisticsController: global, por facultad, por zona
- [x] DTOs: faculty.dto, zone.dto, slot.dto
- [x] Unit tests: slots.service.spec.ts ✅
- [x] Dockerfile
- [x] Build y tests verificados

---

### [HIST-06] Reservation Service — Backend
**Labels:** `backend` `kafka` | **Huly:** Done

- [x] Generar con Nx
- [x] Prisma schema: Reservation con reservationCode único (8 chars), ReservationStatus enum
- [x] HttpClientModules para parking-service, vehicle-service, user-service
- [x] Flujo crear reservación: verificar slot → verificar vehículo → crear → reservar slot
- [x] InternalReservationsController (ServiceKeyGuard)
- [x] Kafka producer: reservation.cancelled, reservation.expired, reservation.checkout
- [x] Cron job (`@nestjs/schedule`): expira reservaciones PENDING cada 1 minuto
- [x] Unit tests: reservations.service.spec.ts ✅
- [x] Dockerfile
- [x] Build y tests verificados

---

### [HIST-07] Gateway Service — Backend
**Labels:** `backend` | **Huly:** Done

- [x] Generar con Nx
- [x] ProxyModule con http-proxy-middleware
- [x] JwtGatewayGuard: valida JWT, inyecta x-user-id, x-user-email, x-user-role downstream
- [x] ThrottlerModule: 60 req/min por IP
- [x] Rutas públicas: /api/auth/*, /health, /metrics
- [x] Dockerfile con EIP (IP pública fija en Terraform QA)

---

### [HIST-08] Frontend NextJS
**Labels:** `frontend` | **Huly:** Done

- [x] Generar con `@nx/next`
- [x] App Router con grupos (auth) y (dashboard)
- [x] TailwindCSS + lucide-react
- [x] LoginForm con react-hook-form + zod validation
- [x] DashboardShell + Sidebar con navegación por rol (ADMIN / USER)
- [x] Admin: StatCards, SlotsPage CRUD completo (FacultyModal, ZoneModal, SlotModal)
- [x] Admin: reports page con estadísticas
- [x] User: dashboard con mapa Leaflet, reservaciones, vehículo, settings
- [x] MapView con Leaflet (dynamic import SSR false), markers coloreados por estado
- [x] services/: parking.service.ts, reservation.service.ts, user.service.ts
- [x] lib/api.ts: axios instance con interceptor de Bearer token
- [x] Dockerfile

---

### [HIST-09] Docker Compose local
**Labels:** `devops` | **Huly:** Done

- [x] postgres:16 con healthcheck y postgres-init.sql (5 DBs)
- [x] redis:7 con healthcheck
- [x] kafka (KRaft mode, imagen confluentinc/cp-kafka)
- [x] Los 7 servicios con depends_on correcto
- [x] Red: smartparking-network
- [x] Verificado: `docker-compose up --build` levanta todo

---

### [HIST-10] Terraform QA
**Labels:** `infra` | **Huly:** Done

- [x] Módulo vpc: VPC + 2 public subnets + IGW + route tables
- [x] Módulo bastion: EC2 jump host
- [x] Módulo ec2: genérico, reutilizable para todos los servicios
- [x] Módulo security_groups: SG por servicio con reglas inter-servicio
- [x] Environment qa: 8 EC2 t3.micro, 2 EIPs (gateway + frontend)
- [x] Environment prod: estructura base

---

### [HIST-11] GitHub Actions CI/CD
**Labels:** `devops` | **Huly:** Done

- [x] ci.yml: lint + unit tests + build (trigger: todos los branches)
- [x] qa.yml: CI → Docker Hub push → SSH deploy via Bastion (trigger: branch QA)
- [x] prod.yml: estructura base (trigger: branch PROD)

---

# ══════════════════════════════════════════
# FASE 1 — ESTABILIZACIÓN QA
# Milestone: QA Estable | Estado: In Progress
# ══════════════════════════════════════════

### [QA-01] Build completo sin errores
**Labels:** `backend` `qa-blocker` | **Huly:** Todo

```bash
cd smart-parking
npm ci
npx nx run-many --target=build --all --exclude=frontend --parallel=3
npx nx run-many --target=test --all --parallel=3
```

- [ ] 0 errores de compilación en los 6 servicios backend
- [ ] 0 tests fallidos
- [ ] Frontend build pasa

→ Dime **"QA-01 listo"** cuando pase esto

---

### [QA-02] Docker Compose levanta todo correctamente
**Labels:** `backend` `devops` `qa-blocker` | **Huly:** Todo

```bash
docker-compose up --build -d && sleep 30
curl http://localhost:3000/health  # auth
curl http://localhost:3001/health  # user
curl http://localhost:3003/health  # vehicle
curl http://localhost:3004/health  # parking
curl http://localhost:3005/health  # reservation
curl http://localhost:3006/health  # gateway
```

- [ ] Todos los contenedores en estado `Up`
- [ ] Los 6 health endpoints responden `{"status":"ok"}`
- [ ] Frontend accesible en http://localhost:3002

→ Dime **"QA-02 listo"**

---

### [QA-03] Pipeline QA despliega en AWS
**Labels:** `devops` `infra` `qa-blocker` | **Huly:** Todo

- [ ] Secrets configurados en GitHub (DOCKERHUB, AWS, BASTION_SSH_KEY)
- [ ] Variable configurada: `QA_GATEWAY_URL`
- [ ] Push a branch `QA` ejecuta el pipeline
- [ ] Job `ci-check` ✅
- [ ] Job `docker-push` ✅ (7 imágenes en Docker Hub con tag `:qa`)
- [ ] Job `deploy` ✅
- [ ] `curl http://<EIP_GATEWAY>:3006/health` → 200

→ Dime **"QA-03 listo"**

---

### [QA-04] Flujo completo de usuario en QA
**Labels:** `frontend` `backend` `qa-blocker` | **Huly:** Todo

- [ ] Register → Login funciona
- [ ] Registrar vehículo funciona
- [ ] Ver mapa de slots funciona
- [ ] Crear reservación → código de 8 chars generado
- [ ] Admin ve estadísticas

→ Dime **"QA-04 listo"**

---

# ══════════════════════════════════════════
# FASE 2 — PAYMENT SERVICE
# Milestone: Payment Service | Estado: Backlog
# Lee: .claude/payment-service.md antes de empezar
# ══════════════════════════════════════════

### [PAY-01] Crear estructura base payment-service
**Labels:** `backend` | **Huly:** Backlog

- [ ] `npx nx generate @nx/nest:application payment-service`
- [ ] Copiar estructura estándar de otro servicio (ej: vehicle-service)
- [ ] Crear `prisma/payment/schema.prisma` con modelo Payment
- [ ] Crear `prisma.payment.config.ts`
- [ ] Generar cliente Prisma
- [ ] `npx nx build payment-service` sin errores
- [ ] `curl http://localhost:3007/health` → `{"status":"ok"}`

→ Dime **"PAY-01 listo"**

---

### [PAY-02] Implementar endpoints de pago
**Labels:** `backend` | **Huly:** Backlog

- [ ] `POST /api/payments` — crear pago con simulación (siempre COMPLETED en QA)
- [ ] `GET /api/payments/:id` — consultar pago
- [ ] `GET /api/payments/reservation/:reservationId`
- [ ] `GET /api/payments/my` — mis pagos
- [ ] DTOs: create-payment.dto, payment-response.dto
- [ ] Generar reference único `PAY-XXXXXXXX`
- [ ] Unit test: payments.service.spec.ts

→ Dime **"PAY-02 listo"**

---

### [PAY-03] Payment produce evento Kafka
**Labels:** `backend` `kafka` | **Huly:** Backlog

- [ ] KafkaModule añadido al payment-service
- [ ] Al crear pago exitoso → produce `payment.completed` con payload correcto
- [ ] reservation-service consume `payment.completed` → reservación pasa a ACTIVE
- [ ] Verificar con `docker-compose logs reservation-service` que consume el evento

→ Dime **"PAY-03 listo"**

---

### [PAY-04] Infraestructura payment-service
**Labels:** `infra` `devops` | **Huly:** Backlog

- [ ] Añadir `paymentdb` en `postgres-init.sql`
- [ ] Añadir `payment-service` en `docker-compose.yml`
- [ ] `docker-compose up payment-service` levanta correctamente
- [ ] Añadir módulo EC2 en `infra/terraform/environments/qa/main.tf`
- [ ] Añadir Security Group en `infra/terraform/modules/security_groups/main.tf`
- [ ] `terraform plan` muestra el EC2 como nuevo recurso
- [ ] Añadir paso de build/push en `qa.yml`
- [ ] Añadir paso de deploy en `qa.yml`
- [ ] Pipeline QA completo con payment-service ✅

→ Dime **"PAY-04 listo"**

---

### [PAY-05] Flujo de pago en frontend
**Labels:** `frontend` | **Huly:** Backlog

- [ ] Crear `services/payment.service.ts`
- [ ] En `user/reservations/page.tsx`: botón "Pagar" al lado de reservaciones PENDING
- [ ] Modal de pago con confirmación → llama `POST /api/payments`
- [ ] Al completar pago → actualizar estado de reservación en UI
- [ ] Estado ACTIVE visible en la lista de reservaciones

→ Dime **"PAY-05 listo"**

---

# ══════════════════════════════════════════
# FASE 3 — NOTIFICATION SERVICE
# Milestone: Notification Service | Estado: Backlog
# Lee: .claude/notification-service.md antes de empezar
# ══════════════════════════════════════════

### [NOT-01] Crear estructura base notification-service
**Labels:** `backend` `kafka` | **Huly:** Backlog

- [ ] `npx nx generate @nx/nest:application notification-service`
- [ ] Estructura sin Prisma (no tiene BD)
- [ ] KafkaConsumerService suscripto a: payment.completed, reservation.cancelled, reservation.expired
- [ ] Redis para deduplicación de eventos
- [ ] `npx nx build notification-service` sin errores
- [ ] Health endpoint responde

→ Dime **"NOT-01 listo"**

---

### [NOT-02] Lógica de notificaciones
**Labels:** `backend` | **Huly:** Backlog

- [ ] `sendPaymentConfirmation()` — log + guardar en Redis `notifications:<userId>`
- [ ] `sendCancellationNotice()` — log + Redis
- [ ] `sendExpirationNotice()` — log + Redis
- [ ] Deduplicación funcionando (no procesa el mismo evento 2 veces)
- [ ] Verificar con `docker-compose logs notification-service` que recibe eventos

→ Dime **"NOT-02 listo"**

---

### [NOT-03] Infraestructura notification-service
**Labels:** `infra` `devops` | **Huly:** Backlog

- [ ] Añadir en `docker-compose.yml`
- [ ] EC2 en Terraform QA
- [ ] Pipeline QA actualizado

→ Dime **"NOT-03 listo"**

---

# ══════════════════════════════════════════
# FASE 4 — ANALYTICS SERVICE (MongoDB)
# Milestone: Analytics + 3ra BD | Estado: Backlog
# Lee: .claude/analytics-service.md antes de empezar
# ══════════════════════════════════════════

### [ANA-01] MongoDB en docker-compose
**Labels:** `infra` | **Huly:** Backlog

- [ ] Añadir `mongodb:7` en docker-compose con healthcheck y volumen
- [ ] `docker-compose up mongodb` levanta
- [ ] Conexión verificada: `mongosh mongodb://localhost:27017`

→ Dime **"ANA-01 listo"**

---

### [ANA-02] Crear analytics-service con Mongoose
**Labels:** `backend` | **Huly:** Backlog

- [ ] `npx nx generate @nx/nest:application analytics-service`
- [ ] Instalar: `npm install @nestjs/mongoose mongoose`
- [ ] MongooseModule configurado con MONGODB_URI
- [ ] Schemas: SlotEvent, ReservationEvent, PaymentEvent
- [ ] KafkaConsumer: consume todos los topics y persiste en MongoDB
- [ ] Health endpoint incluye estado MongoDB
- [ ] Build sin errores

→ Dime **"ANA-02 listo"**

---

### [ANA-03] Endpoints de estadísticas
**Labels:** `backend` | **Huly:** Backlog

- [ ] `GET /api/analytics/occupancy` — datos reales de MongoDB
- [ ] `GET /api/analytics/reservations/daily` — últimos 30 días
- [ ] `GET /api/analytics/top-slots`
- [ ] `GET /api/analytics/revenue/total`
- [ ] Todos requieren role ADMIN
- [ ] Verificar con Postman/curl que retornan datos reales

→ Dime **"ANA-03 listo"**

---

### [ANA-04] Dashboard analytics en frontend
**Labels:** `frontend` | **Huly:** Backlog

- [ ] Crear `services/analytics.service.ts`
- [ ] Crear `admin/analytics/page.tsx`
- [ ] Gráfica de reservaciones por día (recharts LineChart)
- [ ] Cards de ocupación actual por zona
- [ ] Card de ingresos totales
- [ ] Añadir "Analytics" en Sidebar bajo menú ADMIN

→ Dime **"ANA-04 listo"**

---

### [ANA-05] Infraestructura analytics + MongoDB en QA
**Labels:** `infra` `devops` | **Huly:** Backlog

- [ ] EC2 para MongoDB en Terraform QA
- [ ] EC2 para analytics-service en Terraform QA
- [ ] Gateway actualizado con ruta `/analytics/*` → analytics-service:3009
- [ ] Pipeline QA actualizado

→ Dime **"ANA-05 listo"**

---

# ══════════════════════════════════════════
# FASE 5 — WEBSOCKET (Tiempo Real)
# Milestone: Comunicación en Tiempo Real | Estado: Backlog
# ══════════════════════════════════════════

### [WS-01] WebSocket Gateway en parking-service
**Labels:** `backend` | **Huly:** Backlog

- [ ] Instalar: `@nestjs/websockets @nestjs/platform-socket.io socket.io`
- [ ] Crear `ParkingGateway` con namespace `/parking`
- [ ] Al cambiar status de slot → emitir `slot:status:changed` con `{ slotId, status, zoneId }`
- [ ] Verificar con wscat: `wscat -c ws://localhost:3004/parking`
- [ ] Al cambiar un slot desde admin → llega el evento al cliente

→ Dime **"WS-01 listo"**

---

### [WS-02] Cliente WebSocket en frontend
**Labels:** `frontend` | **Huly:** Backlog

- [ ] Instalar: `npm install socket.io-client`
- [ ] Crear `hooks/useSlotAvailability.ts`
- [ ] Integrar en `MapInner.tsx` — markers se actualizan sin reload
- [ ] Verificar en browser Network tab: conexión WebSocket activa

→ Dime **"WS-02 listo"**

---

# ══════════════════════════════════════════
# FASE 6 — gRPC
# Milestone: Comunicación gRPC | Estado: Backlog
# ══════════════════════════════════════════

### [GRPC-01] Definir .proto files
**Labels:** `backend` | **Huly:** Backlog

- [ ] Crear `smart-parking/shared/proto/parking.proto`
- [ ] Definir: CheckSlotAvailability, ReserveSlot, ReleaseSlot
- [ ] Instalar: `@grpc/grpc-js @grpc/proto-loader @nestjs/microservices`

→ Dime **"GRPC-01 listo"**

---

### [GRPC-02] gRPC server en parking-service
**Labels:** `backend` | **Huly:** Backlog

- [ ] parking-service expone gRPC en puerto 50051
- [ ] Implementar los 3 métodos del proto
- [ ] Verificar con cliente gRPC (grpcurl o Postman)

→ Dime **"GRPC-02 listo"**

---

### [GRPC-03] gRPC client en reservation-service
**Labels:** `backend` | **Huly:** Backlog

- [ ] reservation-service llama a parking vía gRPC (no HTTP)
- [ ] Flujo crear reservación completo usando gRPC ✅
- [ ] HTTP interno desactivado para esas rutas

→ Dime **"GRPC-03 listo"**

---

# ══════════════════════════════════════════
# FASE 7 — OBSERVABILIDAD
# Milestone: Prometheus + Grafana | Estado: Backlog
# ══════════════════════════════════════════

### [OBS-01] Prometheus scrape config
**Labels:** `infra` | **Huly:** Backlog

- [ ] Crear `infra/monitoring/prometheus.yml` con scrape de los 10 servicios
- [ ] Añadir Prometheus en docker-compose
- [ ] `http://localhost:9090/targets` → todos los targets UP

→ Dime **"OBS-01 listo"**

---

### [OBS-02] Grafana dashboards
**Labels:** `infra` | **Huly:** Backlog

- [ ] Añadir Grafana en docker-compose (puerto 3100)
- [ ] Dashboard "Overview": req/sec, latency p95, error rate por servicio
- [ ] Dashboard "Reservations": tasa de creación, cancelaciones

→ Dime **"OBS-02 listo"**

---

### [OBS-03] AlertManager
**Labels:** `infra` | **Huly:** Backlog

- [ ] Añadir AlertManager en docker-compose
- [ ] Reglas: servicio caído > 1min, error rate > 5%
- [ ] Bajar un servicio → alerta aparece en 1 minuto

→ Dime **"OBS-03 listo"**

---

### [OBS-04] Stack de observabilidad en EC2 QA
**Labels:** `infra` `devops` | **Huly:** Backlog

- [ ] EC2 dedicado de monitoring en Terraform QA
- [ ] docker-compose con Prometheus + Grafana + AlertManager
- [ ] Accesible: `http://<MONITORING_EIP>:9090` (Prometheus), `:3100` (Grafana)

→ Dime **"OBS-04 listo"**

---

# ══════════════════════════════════════════
# FASE 8 — TESTING COMPLETO
# Milestone: Testing | Estado: Backlog
# ══════════════════════════════════════════

### [TEST-01] Unit tests faltantes
**Labels:** `testing` | **Huly:** Backlog

- [ ] `vehicle-service`: vehicles.service.spec.ts
- [ ] `gateway-service`: proxy.spec.ts
- [ ] `payment-service`: payments.service.spec.ts (al crearlo)
- [ ] `notification-service`: notifications.service.spec.ts
- [ ] Coverage global > 70%

→ Dime **"TEST-01 listo"**

---

### [TEST-02] Integration tests — Auth flow
**Labels:** `testing` | **Huly:** Backlog

- [ ] Crear `docker-compose.test.yml` con postgres-test y redis-test
- [ ] Test: register → login → refresh → logout con BD real
- [ ] Ejecutar en CI

→ Dime **"TEST-02 listo"**

---

### [TEST-03] Integration tests — Reservation flow
**Labels:** `testing` | **Huly:** Backlog

- [ ] Test: crear slot → crear reservación → verificar slot RESERVED → checkout → slot AVAILABLE

→ Dime **"TEST-03 listo"**

---

### [TEST-04] Smoke tests post-deploy
**Labels:** `testing` `devops` | **Huly:** Backlog

- [ ] Crear `tests/smoke/post-deploy.sh` con curl a todos los health endpoints
- [ ] Añadir como job en `qa.yml` después del deploy

→ Dime **"TEST-04 listo"**

---

### [TEST-05] Load tests con k6
**Labels:** `testing` | **Huly:** Backlog

- [ ] `tests/load/smoke.js` — 5 VUs, 30s, p95 < 500ms
- [ ] `tests/load/load.js` — 20 VUs, 5min
- [ ] Añadir en pipeline QA

→ Dime **"TEST-05 listo"**

---

# ══════════════════════════════════════════
# FASE 9 — SWAGGER + DOCUMENTACIÓN
# Milestone: Docs | Estado: Backlog
# ══════════════════════════════════════════

### [DOC-01] Swagger en todos los servicios
**Labels:** `docs` | **Huly:** Backlog

- [ ] auth-service: `/api/docs` con todos los endpoints + Bearer auth
- [ ] user-service: `/api/docs`
- [ ] vehicle-service: `/api/docs`
- [ ] parking-service: `/api/docs`
- [ ] reservation-service: `/api/docs`
- [ ] gateway-service: `/api/docs` (proxy no necesita Swagger propio — opcional)

→ Dime **"DOC-01 listo"**

---

### [DOC-02] ADRs
**Labels:** `docs` | **Huly:** Backlog

- [ ] `docs/adr/ADR-001-nx-monorepo.md`
- [ ] `docs/adr/ADR-002-kafka-kraft.md`
- [ ] `docs/adr/ADR-003-prisma-por-servicio.md`
- [ ] `docs/adr/ADR-004-jwt-refresh-token.md`
- [ ] `docs/adr/ADR-005-grpc-comunicacion-interna.md`
- [ ] `docs/adr/ADR-006-mongodb-analytics.md`

→ Dime **"DOC-02 listo"**

---

### [DOC-03] README principal
**Labels:** `docs` | **Huly:** Backlog

- [ ] Arquitectura del sistema (diagrama texto)
- [ ] Cómo correr localmente (docker-compose)
- [ ] Cómo correr los tests
- [ ] Cómo desplegar en QA (Terraform + GitHub Actions)
- [ ] Variables de entorno requeridas

→ Dime **"DOC-03 listo"**

---

# ══════════════════════════════════════════
# FASE 10 — PRODUCCIÓN
# Milestone: PROD | Estado: Backlog
# ══════════════════════════════════════════

### [PROD-01] RDS PostgreSQL Multi-AZ en Terraform
**Labels:** `infra` | **Huly:** Backlog
- [ ] Módulo RDS en `infra/terraform/modules/rds/`
- [ ] Multi-AZ habilitado
- [ ] Private subnet group
- [ ] Security group: solo acceso desde EC2 de servicios

### [PROD-02] ElastiCache Redis
**Labels:** `infra` | **Huly:** Backlog
- [ ] Módulo ElastiCache en Terraform
- [ ] Cluster mode disabled (single node para PROD inicial)

### [PROD-03] Application Load Balancer + Auto Scaling Groups
**Labels:** `infra` | **Huly:** Backlog
- [ ] ALB con listeners HTTP/HTTPS
- [ ] Target groups por servicio
- [ ] ASG: min 1, max 3, por servicio
- [ ] Health check en ALB → /health de cada servicio

### [PROD-04] Private Subnets + NAT Gateway
**Labels:** `infra` | **Huly:** Backlog
- [ ] 2 private subnets (2 AZs)
- [ ] NAT Gateway en public subnet
- [ ] Servicios backend en private subnet

### [PROD-05] IAM Roles para EC2
**Labels:** `infra` | **Huly:** Backlog
- [ ] Role con policy para leer Secrets Manager
- [ ] Role para logs en CloudWatch
- [ ] Instance profile asignado a cada EC2

### [PROD-06] AWS Secrets Manager
**Labels:** `infra` `devops` | **Huly:** Backlog
- [ ] Secreto por servicio con sus env vars sensibles
- [ ] EC2 user_data lee secrets al arrancar

### [PROD-07] Cloudflare DNS + proxying
**Labels:** `infra` | **Huly:** Backlog
- [ ] Dominio apuntando al ALB vía Cloudflare
- [ ] Proxy habilitado (orange cloud)
- [ ] SSL modo Full

### [PROD-08] AWS WAF en ALB
**Labels:** `infra` | **Huly:** Backlog
- [ ] WAF Web ACL asociada al ALB
- [ ] Reglas: rate limiting, SQL injection, XSS

---

## Resumen de progreso

| Fase | Issues | Estado |
|---|---|---|
| 0 — Historial | HIST-01..11 | ✅ Done |
| 1 — QA Estable | QA-01..04 | 🔄 In Progress |
| 2 — Payment | PAY-01..05 | ⏳ Backlog |
| 3 — Notification | NOT-01..03 | ⏳ Backlog |
| 4 — Analytics | ANA-01..05 | ⏳ Backlog |
| 5 — WebSocket | WS-01..02 | ⏳ Backlog |
| 6 — gRPC | GRPC-01..03 | ⏳ Backlog |
| 7 — Observabilidad | OBS-01..04 | ⏳ Backlog |
| 8 — Testing | TEST-01..05 | ⏳ Backlog |
| 9 — Docs | DOC-01..03 | ⏳ Backlog |
| 10 — PROD | PROD-01..08 | ⏳ Backlog |

**Microservicios: 6/10** | **BDs: 2/3** | **Protocolos extra: 0/3**
