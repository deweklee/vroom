# Vroom

A vehicle ownership tracker for managing your cars in one place. Log fuel fill-ups, track maintenance, record modifications, and view analytics across your entire garage.

## Features

- **Vehicle management** — add and manage multiple vehicles with make, model, year, VIN, and purchase info
- **Fuel tracking** — log fill-ups with odometer, gallons, and price per gallon; total cost calculated automatically
- **Maintenance records** — track oil changes, brake jobs, tire rotations, and custom service types with cost and shop info
- **Modification tracking** — record upgrades and mods by category (performance, cosmetic, audio, etc.) with cost history
- **Analytics** — automatically calculated stats per vehicle: average MPG, total fuel cost, total maintenance cost, total mod spend, and cost per mile
- **Charts** — MPG trend and fuel cost visualized per fill-up
- **Authentication** — JWT-based auth with bcrypt password hashing; all data scoped to the authenticated user

## Tech Stack

| Layer | Technology |
|---|---|
| API | Go, Gin, pgx/v5 |
| Database | PostgreSQL 16 |
| Events | NATS |
| Analytics Worker | Python, asyncio, asyncpg, nats-py |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Recharts |
| Auth | JWT (golang-jwt/v5), bcrypt |
| Containers | Docker, Docker Compose |
| Infrastructure | Kubernetes manifests (in `infrastructure/kubernetes/`) |

## Architecture

```
Browser (Next.js)
      │
      ▼
  Go API (Gin)
      │
      ├──► PostgreSQL  (persistent storage)
      │
      └──► NATS  ──►  Python Analytics Worker
                              │
                              ▼
                        PostgreSQL (vehicle_stats)
```

The API publishes events to NATS on every fuel, maintenance, and modification entry. The Python worker consumes these events and recalculates vehicle stats asynchronously.

## Project Structure

```
vroom/
├── services/api/              # Go REST API
│   ├── cmd/server/main.go
│   └── internal/
│       ├── auth/              # JWT auth + middleware
│       ├── vehicle/           # Vehicle CRUD
│       ├── fuel/              # Fuel tracking
│       ├── maintenance/       # Maintenance records
│       ├── modifications/     # Mod tracking
│       └── events/            # NATS publisher
├── workers/analytics-worker/  # Python analytics worker
├── frontend/vroom-frontend/   # Next.js frontend
├── infrastructure/
│   ├── migrations/            # SQL migrations
│   └── kubernetes/            # K8s manifests
└── docker-compose.yml
```

## Running Locally

**Prerequisites:** Docker, Node.js

**1. Start backend services**

```bash
docker compose up -d
```

This starts PostgreSQL, NATS, the Go API, and the Python analytics worker.

**2. Run migrations**

```bash
bash scripts/run-migrations.sh
```

**3. Start the frontend**

```bash
cd frontend/vroom-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | API, Worker | PostgreSQL connection string |
| `JWT_SECRET` | API | Secret for signing JWTs |
| `NATS_URL` | API, Worker | NATS server URL |
| `FRONTEND_URL` | API | Frontend origin for CORS (production) |
| `NEXT_PUBLIC_API_URL` | Frontend | API base URL (defaults to `http://localhost:8080`) |

## API Endpoints

```
POST   /auth/register
POST   /auth/login

GET    /vehicles
POST   /vehicles
GET    /vehicles/:id
PUT    /vehicles/:id
DELETE /vehicles/:id
GET    /vehicles/:id/stats

GET    /vehicles/:id/fuel
POST   /vehicles/:id/fuel

GET    /vehicles/:id/maintenance
POST   /vehicles/:id/maintenance

GET    /vehicles/:id/mods
POST   /vehicles/:id/mods
```
