# Vroom — Progress Tracker

Track phase and task completion as we build. Check off items as you go.

**Started:** Phase 1
**Current phase:** 10

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

## Phase 10 — Python Analytics Worker

- [ ] `workers/analytics-worker`: venv, dependencies (nats-py, pandas, psycopg2-binary)
- [ ] Consumers for fuel, maintenance, modification events
- [ ] Update `vehicle_stats` (MPG, costs, etc.)
- [ ] Idempotency and retries for failed messages
- [ ] Run worker and verify stats update
- [ ] Commit

---

## Phase 11 — Frontend

- [ ] `npx create-next-app` in `frontend/`
- [ ] Pages: vehicles list, vehicle details, vehicles/new, fuel form, maintenance form, mods
- [ ] API base URL and auth (e.g. token in headers)
- [ ] Verify in browser
- [ ] Commit

---

## Phase 12 — Dashboard

- [ ] Charts: MPG trend, fuel spending, cost per mile, maintenance costs
- [ ] Wire to API / vehicle_stats
- [ ] Commit

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
