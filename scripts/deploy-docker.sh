#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
DOCKER_DIR="$ROOT_DIR/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yaml"

echo "==> FailDaily deploy (Docker)"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not found" >&2; exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin not found" >&2; exit 1
fi

# Load DB vars from docker/.env
if [ -f "$DOCKER_DIR/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(DB_NAME|DB_ROOT_PASSWORD|MYSQL_ROOT_PASSWORD)=' "$DOCKER_DIR/.env" | xargs -d '\n') || true
fi
DB_NAME=${DB_NAME:-faildaily}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-${MYSQL_ROOT_PASSWORD:-root}}

echo "==> Bringing up database..."
(cd "$DOCKER_DIR" && docker compose up -d db)

echo "==> Waiting for MySQL readiness..."
TRIES=60
until docker exec faildaily_db sh -lc "mysqladmin ping -h 127.0.0.1 -uroot -p\"$DB_ROOT_PASSWORD\" --silent" >/dev/null 2>&1; do
  TRIES=$((TRIES-1))
  if [ "$TRIES" -le 0 ]; then echo "ERROR: MySQL not ready" >&2; exit 1; fi
  sleep 2
done
echo "MySQL ready"

echo "==> Ensuring database $DB_NAME exists..."
docker exec -i faildaily_db sh -lc "mysql -uroot -p\"$DB_ROOT_PASSWORD\" -e 'CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"

echo "==> Checking existing schema..."
HAS_USERS=$(docker exec -i faildaily_db sh -lc "mysql -N -uroot -p\"$DB_ROOT_PASSWORD\" -e \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME' AND table_name='users'\"") || HAS_USERS=0
if [ "${HAS_USERS:-0}" -eq 0 ]; then
  echo "==> Importing base schema..."
  cat "$ROOT_DIR/backend-api/migrations/faildaily.sql" | docker exec -i faildaily_db sh -lc "mysql -uroot -p\"$DB_ROOT_PASSWORD\" \"$DB_NAME\""
else
  echo "==> Schema detected, skipping base import"
fi

echo "==> Applying additional migrations (*.sql)"
for f in "$ROOT_DIR/backend-api/migrations"/*.sql; do
  base=$(basename "$f")
  if [ "$base" != "faildaily.sql" ]; then
    echo "Applying migration: $base"
    cat "$f" | docker exec -i faildaily_db sh -lc "mysql -uroot -p\"$DB_ROOT_PASSWORD\" \"$DB_NAME\"" || true
  fi
done

echo "==> Building and starting Traefik, backend, frontend..."
(cd "$DOCKER_DIR" && docker compose up -d traefik backend frontend)

echo "==> Verifying backend health from container..."
docker exec faildaily_backend sh -lc "apk add --no-cache curl >/dev/null 2>&1 || true; curl -sf http://localhost:3000/health || (echo 'Backend health failed' >&2; exit 1)" >/dev/null
echo "Backend OK"

echo "==> Done. Access the app via http://localhost:8000"
