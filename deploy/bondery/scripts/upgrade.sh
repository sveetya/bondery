#!/usr/bin/env bash
# Pulls the latest api/webapp images and recreates the stack. The `migrate`
# service (same API image) runs `prisma migrate deploy` + functions.sql before
# api/webapp start — schema changes always apply, on self-host and production.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker compose pull api webapp
docker compose up -d
