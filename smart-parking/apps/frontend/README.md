# Frontend

Next.js web application for UCE Smart Parking.

- **Port:** 3002 (dev)

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_AUTH_API_URL` | Auth API base (e.g. `http://localhost:3000/api`) |
| `NEXT_PUBLIC_USER_API_URL` | User API base |
| `NEXT_PUBLIC_VEHICLE_API_URL` | Vehicle API base |

## Main routes

| Route | Description |
|-------|-------------|
| `/login` | Login |
| `/register` | Register + auto login |
| `/forgot-password` | Request password reset |
| `/reset-password?token=` | Reset password |
| `/user` | Student dashboard |
| `/user/settings` | Profile, vehicle, password |
| `/admin` | Admin dashboard |

## Local run

```bash
cd smart-parking/apps/frontend
cp .env.example .env.local
npm install
npm run dev -- -p 3002
```

With backend:

```bash
docker compose up -d
```
