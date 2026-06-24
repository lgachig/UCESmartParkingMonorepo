# UCE Smart Parking — AI Context

## Project
NX monorepo. University parking management system. 15 microservices + 1 frontend.

## Stack
- Backend: NestJS + TypeScript + Prisma ORM
- Frontend: Next.js 14
- DBs: PostgreSQL (per service) + Redis + MongoDB + ClickHouse + Elasticsearch
- Messaging: Kafka + RabbitMQ + MQTT
- Infra: AWS EC2 + Docker + Terraform + GitHub Actions

## Services & Ports
| Service | Port | DB |
|---|---|---|
| auth-service | 3000 | parking_auth_db (PostgreSQL) |
| user-service | 3001 | parking_users_db (PostgreSQL) |
| frontend | 3002 | — |
| vehicle-service | 3003 | parking_vehicles_db (PostgreSQL) |
| parking-service | 3004 | parking_slots_db (PostgreSQL) |
| reservation-service | 3005 | parking_reservations_db (PostgreSQL) |
| gateway-service | 3006 | Redis only |

## Shared secrets (same value across all services)
- JWT_SECRET — used by all services to validate tokens
- INTERNAL_SERVICE_KEY — used for inter-service HTTP calls (header: x-service-key)
- Redis — shared instance on auth EC2

## Inter-service communication
- REST: all public endpoints through gateway
- gRPC: auth↔user, parking↔reservation
- Kafka: all async events (reservation.*, parking.*, payment.*)
- RabbitMQ: payment queue, notification queue
- MQTT: IoT sensors → parking-service → realtime-service
- WebSocket: realtime-service → frontend clients
- x-service-key header: internal endpoints between services

## Prisma
Each service has its own schema: prisma/{service}/schema.prisma
Each service has its own config: prisma.{service}.config.ts
Generated clients: generated/{service}-client/

## Roles
ADMIN | STUDENT | PROFESSOR | GUEST

## Patterns used in every service
- GlobalPrefix: /api
- Guards: JwtAuthGuard, RolesGuard, ServiceKeyGuard
- Filter: HttpExceptionFilter
- Interceptor: TransformResponseInterceptor
- Middleware: RequestLoggerMiddleware, MetricsMiddleware
- Health: /health (DB + Redis + Kafka)
- Metrics: /metrics (Prometheus)
- Docs: /docs (Swagger)
- Audit: every action writes to audit_logs table
- Logger: Winston to logs/{service}.log

## Infrastructure
- QA: branch QA → GitHub Actions → Docker Hub → EC2 (7 instances)
- PROD: branch main → same pipeline → separate EC2 instances
- Terraform: infrastructure/environments/qa/ and /prod/
- Auth EC2 runs: PostgreSQL + Redis + Kafka (shared)
- Each other EC2 runs: 1 microservice in Docker

## Pending microservices (not yet implemented)
- payment-service (port 3007)
- notification-service (port 3008)
- ai-service (port 3009)
- analytics-service (port 3010)
- audit-service (port 3011, centralized)
- search-service (port 3012)
- realtime-service (port 3013)

## NX commands
- Serve: npx nx serve {service}
- Build: npx nx build {service}
- Generate client: npx prisma generate --config prisma.{service}.config.ts
- Migrate: npx prisma migrate dev --config prisma.{service}.config.ts