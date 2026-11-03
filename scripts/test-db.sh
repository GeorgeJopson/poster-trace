#!/usr/bin/env bash
# Runs the repository tests against a throwaway Postgres in Docker, removing
# the container afterwards, even if the tests fail.
# Usage: npm run test:db [-- <vitest args>]
# If TEST_DATABASE_URL is already set, uses that database instead of Docker.
set -euo pipefail

if [[ -n "${TEST_DATABASE_URL:-}" ]]; then
  exec npx vitest run --project db "$@"
fi

container=poster-trace-test-db
port=54329

# Clear out a container left behind by an interrupted run.
docker rm -f "$container" >/dev/null 2>&1 || true
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT

docker run -d --rm --name "$container" -e POSTGRES_PASSWORD=postgres \
  -p "$port:5432" postgres:17-alpine >/dev/null

# The server restarts once during first-time init, so check over TCP, which
# only succeeds once the final server is up.
for _ in $(seq 1 60); do
  if docker exec "$container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

TEST_DATABASE_URL="postgres://postgres:postgres@localhost:$port/postgres" \
  npx vitest run --project db "$@"
