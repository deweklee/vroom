# Vroom

**Implementation Start Plan**

This plan outlines the exact steps to begin building **Vroom** from an empty repository to a working MVP.

---

# Phase 1 — Create Project

```id="fslvve"
mkdir vroom
cd vroom
git init
```

Create initial directories:

```id="m7e8y0"
frontend
services/api
workers/analytics-worker
infrastructure
scripts
```

Commit initial structure:

```id="9f9mec"
git add .
git commit -m "initial project structure"
```

---

# Phase 2 — Database Setup

Create **docker-compose.yml**.

Services:

```id="ulntli"
postgres
nats
```

Start them:

```id="p0ef2u"
docker compose up -d
```

Create migration files in `infrastructure/migrations/` using versioned SQL and a migration runner (e.g. [golang-migrate](https://github.com/golang-migrate/migrate), [goose](https://github.com/pressly/goose), or a simple script).

Add SQL schema for tables:

* users
* vehicles
* fuel_entries (include optional `fuel_date DATE` for fill-up date; use `created_at` if not set)
* maintenance_records
* modifications
* vehicle_stats (create here and leave empty; analytics worker populates it in Phase 10)

Add configuration:

* Use environment variables or a small config (e.g. `.env` or `config.go`) for `DATABASE_URL`, `NATS_URL`, and (later) `JWT_SECRET` — no hardcoding.

---

# Phase 3 — Build API Server

Navigate to API directory.

```id="5rboce"
cd services/api
go mod init vroom-api
```

Install dependencies:

```id="20n1hx"
go get github.com/gin-gonic/gin
go get github.com/jackc/pgx/v5
```

Create server:

```id="26bn36"
cmd/server/main.go
```

Run server:

```id="y33u9q"
go run cmd/server/main.go
```

* Enable **CORS** on the API for the frontend origin (e.g. `http://localhost:3000` in dev).
* Load config from environment (see Phase 2).

Verify health endpoint.

---

# Phase 4 — Implement Vehicle CRUD

Endpoints:

```id="hs2fb4"
POST /vehicles
GET /vehicles
GET /vehicles/:id
PUT /vehicles/:id
DELETE /vehicles/:id
```

Test using curl or Postman.

---

# Phase 5 — Authentication

Add `internal/auth` (`handler.go`, `service.go`, `repository.go`, `middleware.go`, `jwt.go`, `model.go`).

* `POST /auth/register` — create user, hash password with **bcrypt**, issue JWT.
* `POST /auth/login` — verify credentials with bcrypt, issue JWT.
* JWT validation middleware; attach `user_id` to Gin context.
* Protect all subsequent API routes with auth middleware.
* All later phases (vehicles, fuel, maintenance, modifications) **must** read `user_id` from the JWT context — never from the request body — to prevent cross-user data access.

---

# Phase 6 — Add Fuel Tracking ✅

Module: `internal/fuel`

Endpoints:

```
POST /vehicles/:id/fuel
GET  /vehicles/:id/fuel
```

* Ownership enforced via SQL EXISTS subquery — only the vehicle's owner can create or list entries.
* `fuel_date` is optional; falls back to `created_at` for display purposes.

---

# Phase 7 — Add Maintenance Tracking ✅

Module: `internal/maintenance`

Endpoints:

```
POST /vehicles/:id/maintenance
GET  /vehicles/:id/maintenance
```

* `service_date` is required (RFC3339 format). All other fields optional.
* Ownership enforced same as fuel — EXISTS subquery on vehicle ownership.

---

# Phase 8 — Add Modification Tracking ✅

Module: `internal/modifications`

Endpoints:

```
POST /vehicles/:id/mods
GET  /vehicles/:id/mods
```

* Ownership enforced same as fuel and maintenance.
* Event publishing (`modification.created`) deferred to Phase 9 (NATS).

---

# Phase 9 — Implement Event System

Add **NATS** client to API.

Publish events:

```id="hcm8qd"
fuel.entry.created
maintenance.record.created
modification.created
vehicle.created
vehicle.updated
vehicle.deleted
```

* `vehicle.deleted` supports cache cleanup or stopping analytics for removed vehicles.

---

# Phase 10 — Build Python Worker

Setup worker:

```id="y27pm4"
cd workers/analytics-worker
python -m venv venv
```

Install dependencies:

```id="2bs6yz"
pip install nats-py pandas psycopg2-binary
```

* Use `psycopg2-binary` to avoid local PostgreSQL dev libraries; alternatively use `psycopg` (v3) if preferred.
* Create consumers for fuel, maintenance, and modification events; update `vehicle_stats` and run analytics (MPG, cost-per-mile, maintenance prediction).
* Design event handling to be **idempotent** where possible (same event processed twice yields same result).
* Add **retries** (and optionally a dead-letter approach) for failed NATS messages so analytics updates are not lost.

Create worker to process events.

---

# Phase 11 — Frontend

Initialize frontend:

```id="l8j8dz"
npx create-next-app@latest
```

Create pages:

```id="3chp9g"
vehicles list
vehicle details
vehicles/new
fuel entry form
maintenance form
modifications (vehicles/[id]/mods)
```

* Ensure API base URL and CORS are configured for the Next.js origin (see Phase 3).

---

# Phase 12 — Dashboard

Add charts for:

* MPG trend
* fuel spending
* cost per mile
* maintenance costs

---

# Phase 13 — Containerization

Create Dockerfiles for:

```id="ibdbkw"
api
analytics-worker
```

Update docker-compose to run backend stack (postgres, nats, api, worker).

Frontend is deployed via Vercel — no Dockerfile needed for production.

---

# Phase 14 — Deployment

**Frontend → Vercel**
- Connect GitHub repo to Vercel
- Set root directory to `frontend/vroom-frontend`
- Set `NEXT_PUBLIC_API_URL` to the production API URL

**Backend → Oracle Cloud VM (Always Free) or similar**
- Provision a VM (ARM A1, 4 OCPUs, 24GB RAM — always free)
- Install Docker + Docker Compose on the VM
- Clone repo and run `docker-compose up -d`
- Set env vars: `DATABASE_URL` (Neon), `JWT_SECRET`, `FRONTEND_URL` (Vercel URL)

**Database → Neon (Always Free)**
- Managed PostgreSQL, no expiry
- Run migrations via Neon SQL Editor

Kubernetes manifests exist in `infrastructure/kubernetes/` for reference and future use.

---

# Phase 15 — Observability (optional)

Add basic observability so the roadmap matches the HLD:

* **Metrics:** Expose Prometheus metrics from the API and workers.
* **Dashboards:** Grafana for key metrics (request rate, latency, worker processing).
* **Logging:** Centralize logs (e.g. Loki or structured JSON to stdout for cluster aggregation).
* **Tracing:** Optional OpenTelemetry for request and event flows.

---

# Phase 16 — Testing

Add tests as you go for critical paths:

* **API:** Integration tests for auth, vehicle CRUD, fuel, maintenance, modifications (e.g. httptest or similar).
* **Worker:** Unit or integration tests for analytics logic (MPG, cost-per-mile, idempotency).
* Run tests in CI (e.g. GitHub Actions) before merge.

---

# Final Outcome

After completing these steps, **Vroom** will be a functioning platform capable of:

* tracking vehicles
* logging fuel usage
* tracking maintenance
* tracking modifications
* authenticated access (JWT)
* computing analytics
* displaying dashboards
* running in containers
* deploying to Kubernetes
* (optional) observability and automated tests