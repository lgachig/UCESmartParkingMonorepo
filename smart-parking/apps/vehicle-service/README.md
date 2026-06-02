# Vehicle Service

Vehicle microservice for UCE Smart Parking. **One vehicle per user** (1:0 or 1:1).

- **Port:** 3003  
- **Swagger:** `/docs`  
- **Metrics:** `/metrics`  
- **Health:** `/api/health`

## Environment variables

| Variable | Description |
|----------|-------------|
| `VEHICLE_SERVICE_PORT` | HTTP port (default 3003) |
| `VEHICLE_DATABASE_URL` | PostgreSQL (`vehicledb`) |
| `REDIS_URL` | Redis |
| `JWT_SECRET` | Same as auth-service |
| `INTERNAL_SERVICE_KEY` | Service key (reserved) |
| `CORS_ORIGINS` | Comma-separated origins |

## Data model

| Field | Type | Description |
|-------|------|-------------|
| `registrationNumber` | string | Registration number |
| `plate` | string | License plate |
| `color` | string | Vehicle color |
| `model` | string | Brand/model |
| `year` | int | Manufacturing year |

## Endpoints

Prefix: `/api/vehicles`. All require JWT.

### `GET /me`

Returns the user's vehicle or `404` if none.

### `POST /me`

Register a vehicle (only if user has none).

**Body:**
```json
{
  "registrationNumber": "MAT-12345",
  "plate": "ABC-1234",
  "color": "Black",
  "model": "Toyota Corolla",
  "year": 2020
}
```

**409** if user already has a vehicle.

### `PATCH /me`

Update own vehicle. Same fields as POST (all optional).

### `DELETE /me`

Remove own vehicle.

**Response:** `{ "message": "Vehicle deleted successfully" }`

## Local run

```bash
docker compose up vehicle-service postgres redis
```

Ensure `vehicledb` exists (`postgres-init.sql`).
