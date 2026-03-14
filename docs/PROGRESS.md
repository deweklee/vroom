# Vroom — Progress Tracker

Track phase and task completion as we build. Check off items as you go.

**Started:** Phase 1
**Current phase:** 13

---

## Phase 1 — Create Project ✅

- [x] Initialize repo (`git init`)
- [x] Create directory structure (`frontend`, `services/api`, `workers/analytics-worker`, `infrastructure`, `scripts`)
- [x] First commit: "initial project structure"

---

## Phase 2 — Database Setup ✅

- [x] Add `docker-compose.yml` (postgres, nats)
- [x] Start services (`docker compose up -d`)
- [x] Add migration runner / versioned SQL in `infrastructure/migrations/`
- [x] Migrations for: users, vehicles, fuel_entries, maintenance_records, modifications, vehicle_stats
- [x] Config: `.env.example` or equivalent for DATABASE_URL, NATS_URL, JWT_SECRET
- [x] Verify DB and NATS are reachable
- [x] Commit

---

## Phase 3 — Build API Server

- [x] `go mod init` and install Gin + pgx
- [x] Create `cmd/server/main.go` with health endpoint
- [x] CORS enabled for frontend origin
- [x] Load config from environment
- [x] Run server and verify `/health`
- [x] Commit

---

## Phase 4 — Vehicle CRUD ✅

- [x] `internal/vehicle`: model, repository, service, handler
- [x] Routes: POST/GET/PUT/DELETE vehicles
- [x] Test with curl or Postman
- [x] Commit

---

## Phase 5 — Authentication ✅

- [x] `internal/auth`: handler, service, middleware
- [x] Login endpoint, JWT issue/validate
- [x] Protect vehicle (and later) routes with auth middleware
- [x] Test login and protected endpoints
- [x] Commit

---

## Phase 6 — Fuel Tracking ✅

- [x] `internal/fuel`: model, repository, service, handler
- [x] POST/GET `/vehicles/:id/fuel`
- [x] Test
- [x] Commit

---

## Phase 7 — Maintenance Tracking ✅

- [x] `internal/maintenance`: model, repository, service, handler
- [x] POST/GET `/vehicles/:id/maintenance`
- [x] Test
- [x] Commit

---

## Phase 8 — Modification Tracking ✅

- [x] `internal/modifications`: model, repository, service, handler
- [x] POST/GET `/vehicles/:id/mods`
- [ ] Publish `modification.created` on create — deferred to Phase 9
- [x] Test
- [x] Commit

---

## Phase 9 — Event System ✅

- [x] Add NATS client to API (`internal/events/publisher.go`)
- [x] Publish: fuel.entry.created, maintenance.record.created, modification.created, vehicle.created/updated/deleted
- [x] Falls back to noopPublisher if NATS is unavailable — API never fails due to NATS
- [x] Verify events in NATS (confirmed via `nats sub ">"`)
- [x] Commit

---

## Phase 10 — Python Analytics Worker ✅

- [x] `workers/analytics-worker`: venv, dependencies (nats-py, asyncpg)
- [x] Consumers for fuel, maintenance, modification events
- [x] Update `vehicle_stats` (avg_mpg, total costs, cost_per_mile)
- [x] Recalculates all stats from scratch on every event (idempotent)
- [x] Run worker and verify stats update
- [x] Commit

---

## Phase 11 — Frontend ✅

- [x] Next.js app in `frontend/vroom-frontend/` (TypeScript, Tailwind, App Router)
- [x] Pages: login, register, vehicles list, vehicle detail, fuel, maintenance, mods
- [x] JWT stored in localStorage, injected via `lib/api.ts` fetch wrapper
- [x] Vehicle stats displayed on detail page (avg MPG, costs, cost/mile)
- [x] Fuel form: total cost calculated from gallons × price, date defaults to today
- [x] Added `GET /vehicles/:id/stats` API endpoint
- [x] Verify in browser
- [x] Commit

---

## Phase 12 — Dashboard ✅

- [x] MPG per fill-up line chart on vehicle detail page
- [x] Fuel cost per fill-up bar chart on vehicle detail page
- [x] Charts computed from fuel entries (same logic as Python worker)
- [x] Commit

---

## Phase 13 — Containerization

- [ ] Dockerfiles: frontend, api, analytics-worker
- [ ] docker-compose runs full stack
- [ ] Commit

---

## Phase 14 — Kubernetes Deployment

- [ ] Manifests in `infrastructure/kubernetes`
- [ ] Deployments, StatefulSet (postgres), etc.
- [ ] Optional: kind cluster and `kubectl apply`
- [ ] Commit

---

## Phase 15 — Observability (optional)

- [ ] Prometheus metrics (API + worker)
- [ ] Grafana dashboards
- [ ] Logging (e.g. Loki or structured stdout)
- [ ] Optional: OpenTelemetry tracing
- [ ] Commit

---

## Phase 16 — Testing

- [ ] API integration tests (auth, CRUD)
- [ ] Worker tests (analytics logic)
- [ ] CI (e.g. GitHub Actions)
- [ ] Commit

---

## Notes

Use this space for blockers, decisions, or “remember to…” items.

- 
