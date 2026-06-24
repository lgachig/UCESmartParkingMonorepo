# Parking Service

Parking slot management microservice for UCE Smart Parking.

- **Port:** 3004  
- **Swagger:** `/docs`  
- **Metrics:** `/metrics`  
- **Health:** `/api/health`

## Environment variables

| Variable | Description |
|----------|-------------|
| `PARKING_SERVICE_PORT` | HTTP port (default 3004) |
| `PARKING_DATABASE_URL` | PostgreSQL (`parkingdb`) |
| `REDIS_URL` | Redis |
| `KAFKA_BROKERS` | Kafka broker endpoints (comma separated) |
| `JWT_SECRET` | Same as auth-service |
| `INTERNAL_SERVICE_KEY` | Service key for service-to-service auth |
| `CORS_ORIGINS` | Comma-separated origins |

## Data model

### Faculty
- `id`: number (auto-increment)
- `name`: string
- `code`: string (unique)

### Zone
- `id`: number (auto-increment)
- `name`: string
- `code`: string
- `centerLatitude`: number
- `centerLongitude`: number
- `facultyId`: number

### Slot
- `id`: string (UUID)
- `number`: string
- `status`: SlotStatus (AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE, DISABLED)
- `latitude`: number
- `longitude`: number
- `zoneId`: number
- `facultyId`: number

## Endpoints

### Faculties (`/api/faculties`)
- `POST /` (Admin only): Create new faculty
- `GET /`: Get all faculties
- `GET /:id`: Get specific faculty
- `PATCH /:id` (Admin only): Update faculty
- `DELETE /:id` (Admin only): Delete faculty

### Zones (`/api/zones`)
- `POST /` (Admin only): Create new zone
- `GET /`: Get all zones
- `GET /:id`: Get specific zone
- `GET /faculty/:facultyId`: Get all zones of a faculty
- `PATCH /:id` (Admin only): Update zone
- `DELETE /:id` (Admin only): Delete zone

### Slots (`/api/slots`)
- `POST /` (Admin only): Create new slot
- `GET /`: Get all slots
- `GET /:id`: Get specific slot
- `PATCH /:id` (Admin only): Update slot
- `DELETE /:id` (Admin only): Delete slot
- `PATCH /:id/reserve`: Change slot state (AVAILABLE -> RESERVED)
- `PATCH /:id/occupy`: Change slot state (RESERVED -> OCCUPIED)
- `PATCH /:id/release`: Change slot state (RESERVED/OCCUPIED -> AVAILABLE)
- `PATCH /:id/maintenance` (Admin only): Change slot state (-> MAINTENANCE)
- `PATCH /:id/enable` (Admin only): Change slot state (MAINTENANCE -> AVAILABLE)
- `GET /available`: Get available slots
- `GET /occupied`: Get occupied slots
- `GET /reserved`: Get reserved slots
- `GET /maintenance`: Get maintenance slots
- `GET /search`: Search slots with optional query filters (facultyId, zoneId, status)
- `GET /nearby`: Geolocation search (parameters: `lat`, `lng`, `radius`) returning available slots sorted by distance

### Statistics (`/api/statistics`)
- `GET /`: Get global occupancy stats
- `GET /faculties`: Get stats grouped by faculty
- `GET /zones`: Get stats grouped by zone

### Internal (`/api/internal/slots`)
- `GET /:id`: Get slot details (Internal auth)
- `GET /:id/availability`: Verify availability (Internal auth)
- `PATCH /:id/reserve`: Lock slot (Internal auth)
- `PATCH /:id/occupy`: Mark occupied (Internal auth)
- `PATCH /:id/release`: Free slot (Internal auth)

## Local run

```bash
docker compose up -d postgres redis kafka parking-service
```
Ensure `parkingdb` is initialized (`postgres-init.sql`).
