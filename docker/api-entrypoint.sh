#!/bin/sh
# Applies pending database migrations, synchronises roles/permissions (and on
# first run creates the school and administrator), then starts the API.
set -eu

echo "[skoolledger] Applying database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "[skoolledger] Synchronising roles and permissions..."
node dist/database/seed/run-seed.js

echo "[skoolledger] Starting API..."
exec node dist/main.js
