#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_DIR/.env"
BACKUP_DIR="/home/lutvi/eng-pgdata/backups"
LOG_FILE="$BACKUP_DIR/backup.log"
RETENTION_DAYS=14

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found" >> "$LOG_FILE" 2>/dev/null || true
  echo "ERROR: $ENV_FILE not found" >&2
  exit 1
fi

read -r PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE <<< "$(python3 - "$ENV_FILE" <<'PY'
import sys, re, urllib.parse
for line in open(sys.argv[1]):
    m = re.match(r'DATABASE_URL=(.+)$', line.strip())
    if m:
        u = urllib.parse.urlparse(m.group(1))
        print(u.hostname or 'localhost', u.port or 5432, u.username or '', u.password or '', u.path.lstrip('/'))
        break
PY
)"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

mkdir -p "$BACKUP_DIR"

STAMP="$(date '+%Y%m%d-%H%M')"
DUMP_FILE="$BACKUP_DIR/engineering-$STAMP.dump"

if pg_dump -Fc -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$DUMP_FILE"; then
  find "$BACKUP_DIR" -maxdepth 1 -name "engineering-*.dump" -mtime +"$RETENTION_DAYS" -delete
  log "OK backup=$DUMP_FILE size=$(stat -c %s "$DUMP_FILE")"
else
  rm -f "$DUMP_FILE"
  log "FAILED backup=$DUMP_FILE"
  exit 1
fi
