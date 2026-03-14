#!/usr/bin/env bash
# Run migrations. Uses Docker Postgres container if available; otherwise needs psql + DATABASE_URL.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/infrastructure/migrations"
cd "$PROJECT_ROOT"

run_via_docker() {
  for f in "$MIGRATIONS_DIR"/*.up.sql; do
    [ -f "$f" ] || continue
    echo "Running $(basename "$f")..."
    cat "$f" | docker compose exec -T postgres psql -U vroom -d vroom -f -
  done
}

run_via_psql() {
  if [ -z "$DATABASE_URL" ]; then
    if [ -f "$PROJECT_ROOT/.env" ]; then
      set -a
      source "$PROJECT_ROOT/.env"
      set +a
    fi
  fi
  if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set. Set it in .env or the environment."
    exit 1
  fi
  if ! command -v psql >/dev/null 2>&1; then
    echo "Error: psql not found. Start Postgres with Docker and run from the project root: docker compose up -d"
    echo "Then run this script again so it can use the container."
    exit 1
  fi
  for f in "$MIGRATIONS_DIR"/*.up.sql; do
    [ -f "$f" ] || continue
    echo "Running $(basename "$f")..."
    psql "$DATABASE_URL" -f "$f"
  done
}

if command -v docker >/dev/null 2>&1 && docker compose exec -T postgres true 2>/dev/null; then
  echo "Using Postgres in Docker."
  run_via_docker
else
  echo "Docker postgres not available, using psql and DATABASE_URL."
  run_via_psql
fi
echo "Migrations complete."
