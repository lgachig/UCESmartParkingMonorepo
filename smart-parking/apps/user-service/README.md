# User Service

User profile microservice for UCE Smart Parking.

- **Port:** 3001  
- **Swagger:** `/docs`  
- **Metrics:** `/metrics`  
- **Health:** `/api/health`

## Environment variables

| Variable | Description |
|----------|-------------|
| `USER_SERVICE_PORT` | HTTP port (default 3001) |
| `USER_DATABASE_URL` | PostgreSQL (`userdb`) |
| `REDIS_URL` | Redis for caching |
| `JWT_SECRET` | Same as auth-service |
| `INTERNAL_SERVICE_KEY` | For internal POST /users |
| `CORS_ORIGINS` | Comma-separated origins |

## Endpoints

Prefix: `/api/users`

### `POST /` (internal)

Service key required (`x-service-key` header). Used by auth-service on register.

**Body:**
```json
{
  "authUserId": "uuid",
  "firstName": "Luis",
  "lastName": "Achig",
  "phone": "0999999999",
  "role": "STUDENT"
}
```

### `GET /me`

JWT required. Returns full user profile.

### `PATCH /me`

JWT required. Update own profile.

**Body (all optional):**
```json
{
  "firstName": "Luis",
  "lastName": "Achig",
  "phone": "0999999999",
  "avatar": "https://example.com/photo.png"
}
```

### Admin routes

`GET /`, `GET /search`, `GET /:id`, `PATCH /:id`, `DELETE /:id` — require JWT + `ADMIN` role.

## Local run

```bash
docker compose up user-service postgres redis
```
