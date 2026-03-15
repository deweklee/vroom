# Vroom

**Low-Level Design (LLD)**

## 1. Overview

This document defines the implementation details for **Vroom**, including repository structure, database schema, APIs, and services.

The system is designed to allow rapid development while maintaining a clean architecture and clear separation between services.

---

# 2. Repository Structure

The project will use a **monorepo**.

```id="m8w4m3"
vroom/
│
├── frontend/
│
├── services/
│   └── api/
│
├── workers/
│   └── analytics-worker/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── migrations/
│
├── scripts/
│
└── docker-compose.yml
```

---

# 3. Backend API

Language: **Go**

Framework: **Gin**

Structure:

```id="0g8p4a"
services/api/

cmd/server/main.go

internal/

auth/
handler.go
service.go
middleware.go

vehicle/
handler.go
service.go
repository.go
model.go

fuel/
handler.go
service.go
repository.go
model.go

maintenance/
handler.go
service.go
repository.go
model.go

modifications/
handler.go
service.go
repository.go
model.go
```

Layer responsibilities:

Handler
Handles HTTP requests and validation.

Service
Contains business logic.

Repository
Handles database queries.

Model
Defines domain objects.

---

# 4. Database Schema

Database: **PostgreSQL**

### users

```id="qmt4pq"
id UUID PK
email TEXT
password_hash TEXT
created_at TIMESTAMP
```

---

### vehicles

```id="ebl3t9"
id UUID PK
user_id UUID
make TEXT
model TEXT
year INT
vin TEXT
purchase_price NUMERIC
purchase_date DATE
current_mileage INT
created_at TIMESTAMP
```

---

### fuel_entries

```id="l6af3e"
id UUID PK
vehicle_id UUID
fuel_date DATE
odometer INT
gallons NUMERIC
price_per_gallon NUMERIC
total_cost NUMERIC
location TEXT
created_at TIMESTAMP
```

* `fuel_date`: date of fill-up (optional; can default to `created_at` for backward compatibility).

---

### maintenance_records

```id="6bt9qe"
id UUID PK
vehicle_id UUID
service_type TEXT
odometer INT
cost NUMERIC
shop TEXT
notes TEXT
service_date DATE
created_at TIMESTAMP
```

---

### modifications

```id="qps4gc"
id UUID PK
vehicle_id UUID
name TEXT
category TEXT
cost NUMERIC
install_date DATE
notes TEXT
created_at TIMESTAMP
```

---

### vehicle_stats

```id="q2l4w0"
vehicle_id UUID PK
avg_mpg NUMERIC
total_fuel_cost NUMERIC
total_maintenance_cost NUMERIC
total_mod_cost NUMERIC
cost_per_mile NUMERIC
last_updated TIMESTAMP
```

---

# 5. Event System

Vroom uses **event-driven analytics processing**.

Message broker:

* **NATS**

Event examples:

```id="84v3ra"
fuel.entry.created
maintenance.record.created
modification.created
vehicle.created
vehicle.updated
vehicle.deleted
```

* `vehicle.deleted`: used for cache cleanup or to stop analytics for removed vehicles.

Example payload:

```id="w0zt5h"
{
  vehicle_id,
  fuel_entry_id,
  timestamp
}
```

---

# 6. Analytics Worker

Language: **Python**

Responsibilities:

* MPG calculations
* cost-per-mile computation
* maintenance prediction
* updating vehicle statistics

Worker structure:

```id="9h9zje"
analytics-worker/

main.py

consumers/
fuel_events.py
maintenance_events.py
modification_events.py

services/
fuel_analysis.py
cost_analysis.py
maintenance_prediction.py
```

Processing flow:

1. API publishes event
2. Worker consumes event
3. Analytics calculated
4. Results stored in database

---

# 7. Frontend

Framework: **Next.js**

Pages:

```id="rzzx0g"
/dashboard
/vehicles
/vehicles/new
/vehicles/[id]
/vehicles/[id]/fuel
/vehicles/[id]/maintenance
/vehicles/[id]/mods
```

Components:

```id="7yowcv"
vehicle-card
fuel-entry-form
maintenance-form
charts
dashboard-panels
```

---

# 8. Containers

Docker containers (backend only):

```id="afg6hh"
api
analytics-worker
postgres
nats
```

Frontend is deployed via Vercel — not containerized.

---

# 9. Local Development

Backend runs via **Docker Compose**:

```id="9zpl2e"
postgres
nats
api
analytics-worker
```

Frontend runs via Next.js dev server:

```
cd frontend/vroom-frontend
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8080` in `frontend/vroom-frontend/.env.local` if needed (defaults to localhost:8080).

---

# 10. Deployment

| Service | Platform |
|---|---|
| Frontend (Next.js) | Vercel (free) |
| API + Worker + NATS | Oracle Cloud VM — Docker Compose (always free) |
| PostgreSQL | Neon (always free) |

**Environment variables required in production:**
- API: `DATABASE_URL`, `JWT_SECRET`, `NATS_URL`, `FRONTEND_URL`, `PORT`
- Worker: `DATABASE_URL`, `NATS_URL`
- Vercel: `NEXT_PUBLIC_API_URL`

Kubernetes manifests exist in `infrastructure/kubernetes/` for reference.

---

# 11. Authentication

Authentication uses **JWT tokens**.

Flow:

1. User registers (`POST /auth/register`) or logs in (`POST /auth/login`)
2. API verifies credentials (bcrypt password comparison)
3. JWT issued (24h TTL, HS256)
4. Frontend stores token
5. API requests include `Authorization: Bearer <token>` header
6. Auth middleware validates token and injects `user_id` into request context

Password hashing: **bcrypt** (`DefaultCost`).

Vehicle ownership: `user_id` is always taken from the JWT claims — never from the request body. This prevents users from creating or listing resources belonging to other users.

---

# 12. Development Strategy

Development phases (see **Implementation Start Plan** for full steps):

Phase 1
Create project structure

Phase 2
Database setup and migrations

Phase 3
Build API server (CORS, config)

Phase 4
Vehicle CRUD

Phase 5
Authentication (JWT, middleware)

Phase 6
Fuel logging

Phase 7
Maintenance tracking

Phase 8
Modification tracking

Phase 9
Event system (NATS)

Phase 10
Analytics worker (Python)

Phase 11
Frontend (Next.js)

Phase 12
Dashboard analytics

Phase 13
Containerization

Phase 14
Kubernetes deployment

Phase 15
Observability (optional)

Phase 16
Testing
