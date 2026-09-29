#!/usr/bin/env bash
# SkoolLedger restore: replaces ALL current data with a backup made by backup.sh.
#
#   scripts/restore.sh backups/skoolledger-20260929-194500
#   scripts/restore.sh /media/usb/backups/skoolledger-20260929-194500 --yes
#
# Before anything is changed, a safety backup of the current data is written to
# BACKUP_DIR (named skoolledger-<time>), so a mistaken restore can be undone.
source "$(dirname "$0")/lib/common.sh"
require_docker

SOURCE="${1:-}"
CONFIRMED="${2:-}"
[[ -n "$SOURCE" ]] || fail "Usage: scripts/restore.sh <backup-folder> [--yes]"
[[ -d "$SOURCE" ]] || fail "Backup folder not found: $SOURCE"
SOURCE="$(cd "$SOURCE" && pwd)"
for f in database.dump uploads.tar.gz SHA256SUMS; do
  [[ -f "$SOURCE/$f" ]] || fail "$SOURCE is not a SkoolLedger backup (missing $f)."
done

info "Verifying backup checksums..."
(cd "$SOURCE" && sha256_file -c SHA256SUMS --quiet) || fail "Checksum mismatch: the backup is damaged or incomplete."

if [[ "$CONFIRMED" != "--yes" ]]; then
  warn "This will REPLACE all SkoolLedger data with the backup:"
  warn "  $SOURCE"
  [[ -f "$SOURCE/manifest.txt" ]] && sed 's/^/    /' "$SOURCE/manifest.txt" >&2
  read -r -p "Type RESTORE to continue: " answer
  [[ "$answer" == "RESTORE" ]] || fail "Restore cancelled."
fi

compose up -d db >/dev/null
info "Waiting for the database..."
for _ in $(seq 1 30); do
  compose exec -T db pg_isready -U "$(db_user)" -d postgres >/dev/null 2>&1 && break
  sleep 2
done

info "Taking a safety backup of the current data first..."
"$SKOOLLEDGER_ROOT/scripts/backup.sh" || fail "Safety backup failed; nothing was changed."

info "Stopping the application..."
compose stop proxy api >/dev/null

info "Restoring database..."
compose exec -T db psql -U "$(db_user)" -d postgres -v ON_ERROR_STOP=1 -q \
  -c "DROP DATABASE IF EXISTS \"$(db_name)\" WITH (FORCE);" \
  -c "CREATE DATABASE \"$(db_name)\" OWNER \"$(db_user)\";"
compose exec -T db pg_restore -U "$(db_user)" -d "$(db_name)" --no-owner --no-privileges --exit-on-error \
  < "$SOURCE/database.dump"

info "Restoring uploaded files..."
compose run --rm --no-deps -T --entrypoint sh api -c \
  'find /app/uploads -mindepth 1 -delete && tar -xzf - -C /app/uploads' < "$SOURCE/uploads.tar.gz"

info "Starting SkoolLedger (pending migrations are applied automatically)..."
compose up -d >/dev/null
info "Restore complete. Users may need to sign in again."
