#!/usr/bin/env bash
# Backup CSDL ra file .sql.gz trong backups/.
# Chạy: bash scripts/backup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$DB_DIR/backups"
mkdir -p "$BACKUP_DIR"

cd "$DB_DIR"
set -a
# shellcheck disable=SC1091
source .env
set +a

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/lang_uoc_le_${STAMP}.sql.gz"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$OUT_FILE"

echo "Đã backup: $OUT_FILE"
