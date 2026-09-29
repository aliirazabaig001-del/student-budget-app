#!/usr/bin/env bash
# SkoolLedger backup: database (pg_dump) + uploaded files (logos).
#
#   scripts/backup.sh                    # writes to BACKUP_DIR from .env (default ./backups)
#   scripts/backup.sh /media/usb/backups # writes to a USB drive or any folder
#
# Each run creates one folder:
#   skoolledger-YYYYMMDD-HHMMSS/
#     database.dump    PostgreSQL custom-format dump (pg_restore compatible)
#     uploads.tar.gz   school logo and other uploaded files
#     manifest.txt     what, when, which version
#     SHA256SUMS       checksums verified by restore.sh
source "$(dirname "$0")/lib/common.sh"
require_docker

TARGET_ROOT="${1:-$(env_value BACKUP_DIR ./backups)}"
KEEP_DAYS="$(env_value BACKUP_KEEP_DAYS 30)"
STAMP="$(date +%Y%m%d-%H%M%S)"
NAME="skoolledger-${STAMP}"
mkdir -p "$TARGET_ROOT"
TARGET_ROOT="$(cd "$TARGET_ROOT" && pwd)"
WORK="${TARGET_ROOT}/.${NAME}.partial"
FINAL="${TARGET_ROOT}/${NAME}"

compose ps --status running --services | grep -qx db || fail "The database container is not running. Start SkoolLedger first (docker compose up -d)."

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT
mkdir -p "$WORK"

info "Backing up database '$(db_name)'..."
compose exec -T db pg_dump -U "$(db_user)" -d "$(db_name)" --format=custom --no-owner --no-privileges \
  > "$WORK/database.dump"

# A dump that pg_restore cannot read is worse than no backup: check it now.
compose exec -T db pg_restore --list < "$WORK/database.dump" > /dev/null \
  || fail "The database dump could not be verified."

info "Backing up uploaded files..."
if compose ps --status running --services | grep -qx api; then
  compose exec -T api tar -czf - -C /app/uploads . > "$WORK/uploads.tar.gz"
else
  compose run --rm --no-deps -T --entrypoint tar api -czf - -C /app/uploads . > "$WORK/uploads.tar.gz"
fi

API_VERSION="$(compose exec -T api node -e "process.stdout.write(require('/app/package.json').version)" 2>/dev/null || echo unknown)"
cat > "$WORK/manifest.txt" <<EOF
SkoolLedger backup
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
host=$(hostname)
app_version=${API_VERSION}
database=$(db_name)
EOF

(cd "$WORK" && sha256_file database.dump uploads.tar.gz manifest.txt > SHA256SUMS)
mv "$WORK" "$FINAL"
trap - EXIT

if [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]] && (( KEEP_DAYS > 0 )); then
  find "$TARGET_ROOT" -maxdepth 1 -type d -name 'skoolledger-*' -mtime "+${KEEP_DAYS}" -print0 \
    | while IFS= read -r -d '' old; do info "Removing backup older than ${KEEP_DAYS} days: $(basename "$old")"; rm -rf "$old"; done
fi

SIZE="$(du -sh "$FINAL" | cut -f1)"
info "Backup complete: ${FINAL} (${SIZE})"
info "Copy this folder to a USB drive or another computer to keep it safe."
