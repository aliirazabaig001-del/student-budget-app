#!/usr/bin/env bash
# Shared helpers for SkoolLedger shell scripts. Sourced, not executed.

set -euo pipefail

SKOOLLEDGER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SKOOLLEDGER_ROOT"

info() { printf '\033[1;34m[skoolledger]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[skoolledger]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[skoolledger] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

require_docker() {
  command -v docker >/dev/null 2>&1 || fail "Docker is not installed. See docs/INSTALLATION.md."
  docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required (docker compose ...)."
  docker info >/dev/null 2>&1 || fail "Docker is installed but not running. Start Docker and try again."
}

# Reads KEY from .env without executing the file.
env_value() {
  local key="$1" default="${2:-}"
  local value=""
  if [[ -f .env ]]; then
    value="$(grep -E "^${key}=" .env | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true)"
  fi
  printf '%s' "${value:-$default}"
}

compose() { docker compose "$@"; }

db_user() { env_value POSTGRES_USER skoolledger; }
db_name() { env_value POSTGRES_DB skoolledger; }

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$@"; else shasum -a 256 "$@"; fi
}
