#!/usr/bin/env bash
# Áp dụng những migration chưa chạy trong migrations/, theo thứ tự số.
#
# Mỗi file chỉ chạy đúng MỘT lần. Tên file đã chạy được ghi vào bảng
# schema_migrations (xem migrations/000_migration_ledger.sql để biết vì sao
# không còn chạy lại toàn bộ được nữa).
#
# Mỗi file chạy với ON_ERROR_STOP=1 nên lỗi giữa chừng dừng ngay, thay vì bỏ
# qua và để schema ở trạng thái nửa vời.
#
# Chạy:
#   bash scripts/migrate.sh              # áp dụng những file chưa chạy
#   bash scripts/migrate.sh --dry-run    # chỉ liệt kê, không chạy
#   bash scripts/migrate.sh --status     # xem file nào đã chạy, file nào chưa
#   bash scripts/migrate.sh --baseline   # đánh dấu TẤT CẢ là đã chạy, không chạy gì
#
# --baseline dùng đúng một lần, cho CSDL đã tồn tại từ trước khi có sổ ghi.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$DB_DIR/migrations"
LEDGER_FILE="$MIGRATIONS_DIR/000_migration_ledger.sql"

MODE="apply"
case "${1:-}" in
  --dry-run)  MODE="dry-run" ;;
  --status)   MODE="status" ;;
  --baseline) MODE="baseline" ;;
  "")         ;;
  *) echo "Tham số không hiểu: $1" >&2; exit 1 ;;
esac

if [ ! -f "$DB_DIR/.env" ]; then
  echo "Không thấy $DB_DIR/.env - copy từ .env.example và đổi mật khẩu trước." >&2
  exit 1
fi

cd "$DB_DIR"
set -a
# shellcheck disable=SC1091
source .env
set +a

psql_q() {
  docker compose exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -qtA "$@"
}

if ! docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
  echo "Postgres chưa sẵn sàng - chạy 'bash scripts/deploy.sh' trước." >&2
  exit 1
fi

# Sổ ghi phải tồn tại trước mọi thứ khác. File này idempotent.
psql_q -q < "$LEDGER_FILE" >/dev/null

shopt -s nullglob
FILES=("$MIGRATIONS_DIR"/[0-9]*.sql)
shopt -u nullglob

if [ ${#FILES[@]} -eq 0 ]; then
  echo "Không có migration nào trong $MIGRATIONS_DIR"
  exit 0
fi

is_applied() {
  local name="$1"
  local found
  found="$(psql_q -c "SELECT 1 FROM schema_migrations WHERE filename = '$name'")"
  [ -n "$found" ]
}

mark_applied() {
  psql_q -c "INSERT INTO schema_migrations (filename) VALUES ('$1')
             ON CONFLICT (filename) DO NOTHING" >/dev/null
}

if [ "$MODE" = "baseline" ]; then
  for f in "${FILES[@]}"; do
    mark_applied "$(basename "$f")"
  done
  echo "Đã đánh dấu ${#FILES[@]} migration là đã áp dụng, không chạy file nào."
  echo "Chỉ dùng lệnh này cho CSDL đã có sẵn schema trước khi có sổ ghi."
  exit 0
fi

PENDING=()
for f in "${FILES[@]}"; do
  name="$(basename "$f")"
  if is_applied "$name"; then
    [ "$MODE" = "status" ] && echo "  [đã chạy]  $name"
  else
    [ "$MODE" = "status" ] && echo "  [chưa chạy] $name"
    PENDING+=("$f")
  fi
done

if [ "$MODE" = "status" ]; then
  echo "Tổng: ${#FILES[@]} file, ${#PENDING[@]} chưa chạy."
  exit 0
fi

if [ ${#PENDING[@]} -eq 0 ]; then
  echo "Không có migration nào cần chạy. Schema đã cập nhật."
  exit 0
fi

if [ "$MODE" = "dry-run" ]; then
  echo "Sẽ chạy ${#PENDING[@]} migration theo thứ tự:"
  for f in "${PENDING[@]}"; do
    echo "  $(basename "$f")"
  done
  exit 0
fi

echo "Nhắc: hãy chắc chắn đã chạy 'bash scripts/backup.sh' nếu đây là dữ liệu thật."
echo "Áp dụng ${#PENDING[@]} migration..."

for f in "${PENDING[@]}"; do
  name="$(basename "$f")"
  echo "--- $name"
  if ! docker compose exec -T postgres \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q < "$f"; then
    echo "Migration THẤT BẠI tại $name - dừng lại, schema chưa hoàn tất." >&2
    echo "Sửa file rồi chạy lại; những file trước đó đã được ghi nhận nên không chạy lại." >&2
    exit 1
  fi
  mark_applied "$name"
done

echo "Xong. Đã áp dụng ${#PENDING[@]} migration."
