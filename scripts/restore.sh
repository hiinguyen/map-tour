#!/usr/bin/env bash
# Restore CSDL từ 1 file backup .sql.gz.
# Chạy: bash scripts/restore.sh backups/lang_uoc_le_20260101-120000.sql.gz
# CẢNH BÁO: lệnh này ghi đè toàn bộ dữ liệu hiện có trong DB đích.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Cách dùng: $0 <đường-dẫn-file-backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Không tìm thấy file: $BACKUP_FILE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$DB_DIR"
set -a
# shellcheck disable=SC1091
source .env
set +a

read -r -p "Ghi đè toàn bộ dữ liệu trong DB '$POSTGRES_DB'? Nhập 'yes' để tiếp tục: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Đã hủy."
  exit 1
fi

gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Đã restore từ: $BACKUP_FILE"
