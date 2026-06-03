# UCE Smart Parking

Distributed smart parking system for UCE — microservices architecture with NestJS, Next.js, PostgreSQL, Redis, Docker, and AWS QA deployment.

## Architecture

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| **auth-service** | 3000 | `smartparking` | Authentication, JWT, password reset |
| **user-service** | 3001 | `userdb` | User profiles |
| **vehicle-service** | 3003 | `vehicledb` | One vehicle per user |
| **frontend** | 3002 | — | Next.js UI |

Shared infrastructure locally: **PostgreSQL** + **Redis** via Docker Compose.

## QA deployment (4 EC2 instances)

Each service runs on its own EC2 with an **Elastic IP**:

1. **auth** — postgres, redis, auth-service  
2. **user** — user-service (DB on auth EC2)  
3. **vehicle** — vehicle-service (DB on auth EC2)  
4. **frontend** — Next.js container  

### CI/CD flow

```
merge to qa → build images → push Docker Hub (:qa) → SSH each EC2 → docker compose pull && up
```

See [infra/README.md](infra/README.md) for Terraform and GitHub secrets.

## Local development

```bash
# Backend + databases
docker compose up -d

# Frontend
cd smart-parking/apps/frontend
npm run dev -- -p 3002
```

Prisma Studio:

```bash
cd smart-parking
npx prisma studio --config=./prisma.config.ts --port 5555
npx prisma studio --config=./prisma.user.config.ts --port 5556
npx prisma studio --config=./prisma.vehicle.config.ts --port 5557
```

## Service documentation

- [Auth Service](smart-parking/apps/auth-service/README.md)
- [User Service](smart-parking/apps/user-service/README.md)
- [Vehicle Service](smart-parking/apps/vehicle-service/README.md)
- [Frontend](smart-parking/apps/frontend/README.md)

## Repository structure

```
├── docker-compose.yml          # Local dev (build from source)
├── .github/workflows/qa.yml    # CI/CD for QA branch
├── infra/                      # Terraform + EC2 deploy scripts
└── smart-parking/              # Nx monorepo
    ├── apps/
    │   ├── auth-service/
    │   ├── user-service/
    │   ├── vehicle-service/
    │   └── frontend/
    ├── prisma/                 # Auth + user + vehicle schemas
    └── shared/cors.ts          # Shared CORS config
```
