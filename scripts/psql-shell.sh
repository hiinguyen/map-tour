#!/usr/bin/env bash
# Mở psql shell tương tác vào container Postgres đang chạy.
# Chạy: bash scripts/psql-shell.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$DB_DIR"
set -a
# shellcheck disable=SC1091
source .env
set +a

docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
