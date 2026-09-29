#!/usr/bin/env bash
# SkoolLedger installer for Linux / macOS.
#
#   scripts/install.sh
#
# 1. Checks Docker is available.
# 2. Creates .env with strong random secrets (only if .env does not exist).
# 3. Builds and starts SkoolLedger with Docker Compose.
# 4. Prints the address to open and the first administrator login.
source "$(dirname "$0")/lib/common.sh"
require_docker

random_hex() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -hex "$1"
  else head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi
}

set_env() {
  local key="$1" value="$2"
  # Values are hex/alphanumeric, so they are safe inside sed.
  sed -i.bak -e "s#^${key}=.*#${key}=${value}#" .env && rm -f .env.bak
}

if [[ -f .env ]]; then
  info "Using existing .env (delete it to generate new settings)."
else
  info "Creating .env with new random secrets..."
  cp .env.example .env
  DB_PASSWORD="$(random_hex 24)"
  ADMIN_PASSWORD="Sl-$(random_hex 6)-$(random_hex 3)"

  read -r -p "School name [My School]: " SCHOOL_NAME || true
  read -r -p "Administrator email [admin@skoolledger.local]: " ADMIN_EMAIL || true
  read -r -p "Web port [80]: " HTTP_PORT || true

  set_env POSTGRES_PASSWORD "$DB_PASSWORD"
  set_env DATABASE_URL "postgresql://skoolledger:${DB_PASSWORD}@localhost:5432/skoolledger?schema=public"
  set_env JWT_ACCESS_SECRET "$(random_hex 48)"
  set_env INITIAL_ADMIN_PASSWORD "$ADMIN_PASSWORD"
  [[ -n "${HTTP_PORT:-}" ]] && set_env HTTP_PORT "$HTTP_PORT"
  [[ -n "${ADMIN_EMAIL:-}" ]] && set_env INITIAL_ADMIN_EMAIL "$ADMIN_EMAIL"
  if [[ -n "${SCHOOL_NAME:-}" ]]; then
    # School names may contain spaces or punctuation; write them quoted.
    grep -v '^INITIAL_SCHOOL_NAME=' .env > .env.tmp && mv .env.tmp .env
    printf 'INITIAL_SCHOOL_NAME="%s"\n' "${SCHOOL_NAME//\"/}" >> .env
  fi
  # Secrets inside: readable by the owner only (set last, as edits recreate the file).
  chmod 600 .env
fi

info "Building and starting SkoolLedger (the first run can take several minutes)..."
compose up -d --build

PORT="$(env_value HTTP_PORT 80)"
URL="http://localhost$([[ "$PORT" == "80" ]] || printf ':%s' "$PORT")"
info "Waiting for SkoolLedger to become ready..."
for _ in $(seq 1 60); do
  if curl -fsS "${URL}/api/v1/health" >/dev/null 2>&1; then READY=1; break; fi
  sleep 3
done
[[ "${READY:-}" == "1" ]] || fail "SkoolLedger did not start. Check: docker compose logs api"

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
echo
info "SkoolLedger is running."
info "  On this computer:        ${URL}"
[[ -n "$LAN_IP" ]] && info "  From other school PCs:   http://${LAN_IP}$([[ "$PORT" == "80" ]] || printf ':%s' "$PORT")"
info "  Username: $(env_value INITIAL_ADMIN_USERNAME admin)"
info "  Password: $(env_value INITIAL_ADMIN_PASSWORD '(see: docker compose logs api)')"
info "You will be asked to choose a new password at first sign-in."
info "Then remove INITIAL_ADMIN_PASSWORD from .env; it is only used on first start."
