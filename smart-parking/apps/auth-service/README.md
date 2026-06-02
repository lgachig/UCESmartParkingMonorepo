# Auth Service

Authentication microservice for UCE Smart Parking.

- **Port:** 3000  
- **Swagger:** `/docs`  
- **Metrics:** `/metrics`  
- **Health:** `/api/health`

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `USER_SERVICE_URL` | User service base URL |
| `INTERNAL_SERVICE_KEY` | Service-to-service key |
| `FRONTEND_URL` | Used for password reset links |
| `CORS_ORIGINS` | Comma-separated allowed origins |

## Endpoints

All routes are prefixed with `/api/auth`.

### `POST /register`

Create auth account and user profile.

**Body:**
```json
{
  "email": "user@uce.edu.ec",
  "password": "Password1!",
  "firstName": "Luis",
  "lastName": "Achig",
  "phone": "0999999999",
  "role": "STUDENT"
}
```

**Response:** `{ "message": "User registered successfully" }`

### `POST /login`

**Body:** `{ "email", "password" }`  
**Response:** `{ "accessToken", "refreshToken", "user": { "id", "email", "role" } }`

### `GET /profile`

JWT required. Returns `{ "userId", "email", "role" }`.

### `POST /refresh`

**Body:** `{ "refreshToken" }`  
**Response:** new access + refresh tokens.

### `POST /logout`

JWT required. Invalidates tokens.

### `POST /change-password`

JWT required.  
**Body:** `{ "currentPassword", "newPassword" }`

### `POST /forgot-password`

**Body:** `{ "email" }`  
In non-production, may include `resetUrl` in response.

### `POST /reset-password`

**Body:** `{ "token", "newPassword" }`

## Local run

```bash
docker compose up auth-service postgres redis
# or
cd smart-parking && npx nx serve @org/auth-service
```
