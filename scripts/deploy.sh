#!/usr/bin/env bash
# Triển khai/khởi động lại CSDL Postgres trên server bằng Docker Compose.
# Chạy từ bất kỳ đâu: bash scripts/deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$DB_DIR/.env" ]; then
  echo "Không thấy $DB_DIR/.env — copy từ .env.example và đổi mật khẩu trước." >&2
  echo "  cp .env.example .env && nano .env" >&2
  exit 1
fi

cd "$DB_DIR"
docker compose --env-file .env pull postgres
docker compose --env-file .env up -d postgres

echo "Đang chờ Postgres sẵn sàng..."
for _ in $(seq 1 30); do
  if docker compose --env-file .env exec -T postgres pg_isready -U "$(grep -m1 '^POSTGRES_USER=' .env | cut -d= -f2)" >/dev/null 2>&1; then
    echo "Postgres đã sẵn sàng."
    docker compose --env-file .env ps
    exit 0
  fi
  sleep 2
done

echo "Postgres không sẵn sàng sau 60s — kiểm tra log: docker compose logs postgres" >&2
exit 1
