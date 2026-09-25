#!/usr/bin/env bash
# Nâng cấp một CSDL đang chạy thật lên đợt 09/2026 (ranh giới khuôn viên + KML),
# với cam kết: KHÔNG một giá trị nào liên quan đến ảnh bị thay đổi.
#
# Vì sao không dùng thẳng scripts/migrate.sh.
# Server cũ chưa có sổ ghi schema_migrations, nên migrate.sh sẽ tưởng chưa có
# gì chạy và chạy lại từ 001. Trong đó 011_seed_media.sql UPSERT đè url/caption
# /kind của media, 012 gán lại cover/panorama cho site, 013 xoá media. Mọi ảnh
# đã sửa hoặc tải lên qua trang quản trị sẽ bị đè. Script này thay cho bước
# "--baseline rồi DELETE 015 khỏi sổ ghi" làm tay trong
# docs/cap-nhat-2026-09-ranh-gioi-kml.md.
#
# Script làm gì, tất cả trong MỘT transaction:
#   1. Tạo sổ ghi (000) và đánh dấu 001..014 là đã chạy, KHÔNG chạy lại chúng.
#   2. Khoá sites (ACCESS EXCLUSIVE) và mọi bảng chứa dữ liệu ảnh (SHARE), để
#      không ai ghi xen vào giữa hai lần lấy dấu vân tay.
#   3. Lấy dấu vân tay dữ liệu ảnh: toàn bộ từng dòng của media, và cột
#      *media_id* / *media_ids* của mọi bảng khác (tự dò theo tên cột).
#   4. Chạy 015 (bỏ BEGIN/COMMIT riêng của nó để nằm trong transaction này).
#   5. Lấy lại dấu vân tay. Lệch dù chỉ một byte là RAISE, cả transaction bị
#      huỷ, CSDL y nguyên như trước khi chạy.
#   6. Ghi 000 và 015 vào sổ ghi rồi COMMIT (hoặc ROLLBACK nếu --dry-run).
#
# Chạy:
#   bash scripts/upgrade-2026-09-ranh-gioi.sh --dry-run
#       Chạy THẬT toàn bộ trên dữ liệu thật rồi ROLLBACK. Không sao lưu, không
#       ghi gì. Dùng để biết trước lần chạy thật có qua được hay không.
#   bash scripts/upgrade-2026-09-ranh-gioi.sh
#       Sao lưu bằng scripts/backup.sh, rồi áp dụng.
#   bash scripts/upgrade-2026-09-ranh-gioi.sh -f compose.production.yml [--dry-run]
#       Khi server chạy bằng file compose khác docker-compose.yml.
#
# Chạy lại sau khi đã thành công là vô hại: script thấy 015 trong sổ ghi và dừng.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$DB_DIR/migrations"
LEDGER_FILE="$MIGRATIONS_DIR/000_migration_ledger.sql"
TARGET="015_sites_position_and_footprint.sql"
TARGET_FILE="$MIGRATIONS_DIR/$TARGET"

DRY_RUN=0
COMPOSE_FILE_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    -f|--compose-file)
      [ $# -ge 2 ] || { echo "Thiếu tên file sau $1" >&2; exit 1; }
      COMPOSE_FILE_ARG="$2"; shift ;;
    *) echo "Tham số không hiểu: $1" >&2; exit 1 ;;
  esac
  shift
done

die() { echo "LỖI: $*" >&2; exit 1; }

[ -f "$DB_DIR/.env" ] || die "Không thấy $DB_DIR/.env"
[ -f "$LEDGER_FILE" ] || die "Không thấy $LEDGER_FILE - mã nguồn chưa được cập nhật (git pull)?"
[ -f "$TARGET_FILE" ] || die "Không thấy $TARGET_FILE - mã nguồn chưa được cập nhật (git pull)?"

cd "$DB_DIR"
set -a
# shellcheck disable=SC1091
source .env
set +a
if [ -n "$COMPOSE_FILE_ARG" ]; then
  [ -f "$COMPOSE_FILE_ARG" ] || die "Không thấy file compose: $COMPOSE_FILE_ARG"
  export COMPOSE_FILE="$COMPOSE_FILE_ARG"
fi

psql_db() {
  docker compose exec -T postgres \
    psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"
}
query() { psql_db -qtA -c "$1"; }

docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1 \
  || die "Postgres chưa sẵn sàng (docker compose ps để kiểm tra)."

# 015 được nhúng vào transaction của script này nên BEGIN;/COMMIT; của chính
# nó phải bỏ đi. Chỉ bỏ đúng dòng "BEGIN;" và "COMMIT;" đứng riêng; chữ BEGIN
# trong khối DO $$ ... $$ không có dấu chấm phẩy nên không bị động tới. Nếu ai
# sửa 015 làm cấu trúc này đổi thì dừng, không đoán.
[ "$(grep -c '^BEGIN;$' "$TARGET_FILE")" = 1 ] && [ "$(grep -c '^COMMIT;$' "$TARGET_FILE")" = 1 ] \
  || die "$TARGET không còn đúng một dòng 'BEGIN;' và một dòng 'COMMIT;' - xem lại script này."

# ---------------------------------------------------------------- kiểm tra trước
echo "== Kiểm tra trạng thái CSDL '$POSTGRES_DB'"

if [ "$(query "SELECT to_regclass('public.schema_migrations') IS NOT NULL")" = "t" ] \
   && [ -n "$(query "SELECT 1 FROM schema_migrations WHERE filename = '$TARGET'")" ]; then
  echo "$TARGET đã có trong sổ ghi - CSDL đã được nâng cấp, không làm gì."
  exit 0
fi

# CSDL phải đang ở trạng thái sau 014, nếu không việc đánh dấu 001..014 là
# "đã chạy" sẽ là nói dối. Kiểm được những dấu vết mà 001 và 011 để lại.
PRECHECK="$(query "
  SELECT concat_ws(', ',
    CASE WHEN to_regclass('public.sites') IS NULL THEN 'thiếu bảng sites' END,
    CASE WHEN to_regclass('public.media') IS NULL THEN 'thiếu bảng media' END,
    CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_schema = 'public' AND table_name = 'villages'
                             AND column_name = 'slug') THEN 'thiếu villages.slug (001)' END,
    CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_schema = 'public' AND table_name = 'heritage_buildings'
                             AND column_name = 'village_id') THEN 'thiếu heritage_buildings.village_id (001)' END
  )")"
[ -z "$PRECHECK" ] || die "CSDL chưa ở trạng thái sau migration 014: $PRECHECK"

MEDIA_COUNT="$(query "SELECT count(*) FROM media")"
[ "$MEDIA_COUNT" -gt 0 ] || die "Bảng media trống - CSDL chưa chạy 011? Dừng để không đánh dấu sai."

# 015 chỉ tự điền toạ độ cho hai site 'area' của seed 004. Site nào khác thiếu
# toạ độ thì 015 sẽ dừng; báo trước ở đây cho dễ đọc, trước khi tốn công sao lưu.
MISSING="$(query "
  SELECT id || ' | ' || kind || ' | ' || name FROM sites
   WHERE (position_lat IS NULL OR position_lng IS NULL)
     AND id NOT IN ('20000000-0000-0000-0000-000000000005',
                    '20000000-0000-0000-0000-000000000006')
   ORDER BY name")"
if [ -n "$MISSING" ]; then
  echo "Các site sau thiếu toạ độ điểm, 015 không tự điền được:" >&2
  echo "$MISSING" | sed 's/^/  /' >&2
  die "Bổ sung position_lat/position_lng cho chúng rồi chạy lại."
fi

# Mọi migration đứng trước 015 được coi là đã chạy trên server.
BASELINE=()
LATER=()
shopt -s nullglob
for f in "$MIGRATIONS_DIR"/[0-9]*.sql; do
  name="$(basename "$f")"
  [[ "$name" =~ ^[0-9]{3}_[a-z0-9_]+\.sql$ ]] || die "Tên migration lạ: $name"
  if [ "$name" = "000_migration_ledger.sql" ] || [ "$name" = "$TARGET" ]; then
    continue
  elif [[ "$name" < "$TARGET" ]]; then
    BASELINE+=("$name")
  else
    LATER+=("$name")
  fi
done
shopt -u nullglob
[ ${#BASELINE[@]} -gt 0 ] || die "Không thấy migration nào trước $TARGET"

BASELINE_SQL="INSERT INTO schema_migrations (filename) VALUES"
sep=""
for name in "${BASELINE[@]}"; do
  BASELINE_SQL+="$sep ('$name')"
  sep=","
done
BASELINE_SQL+=" ON CONFLICT (filename) DO NOTHING;"

echo "  media hiện có: $MEDIA_COUNT dòng"
echo "  sẽ ĐÁNH DẤU (không chạy lại): ${BASELINE[0]} .. ${BASELINE[${#BASELINE[@]}-1]} (${#BASELINE[@]} file)"
echo "  sẽ CHẠY: $TARGET"
if [ ${#LATER[@]} -gt 0 ]; then
  echo "  bỏ qua, chạy sau bằng scripts/migrate.sh: ${LATER[*]}"
fi

# ---------------------------------------------------------------------- sao lưu
if [ "$DRY_RUN" = 1 ]; then
  echo "== CHẠY THỬ: không sao lưu, cuối cùng sẽ ROLLBACK"
else
  echo "== Sao lưu"
  bash "$SCRIPT_DIR/backup.sh"
fi

# ------------------------------------------------------------------ transaction
echo "== Áp dụng trong một transaction"

FINISH="COMMIT;"
[ "$DRY_RUN" = 1 ] && FINISH="ROLLBACK;"

{
  cat <<'SQL'
BEGIN;
-- Đợi khoá tối đa 15 giây. API đang giữ transaction dài thì thà dừng hẳn còn
-- hơn treo vô hạn và chặn luôn người dùng đang xem bản đồ.
SET LOCAL lock_timeout = '15s';
SQL

  cat "$LEDGER_FILE"

  cat <<'SQL'

-- Dấu vân tay dữ liệu ảnh.
--   media: TOÀN BỘ từng dòng (url, kind, caption, owner, created_at, updated_at...).
--   Bảng khác: id + mọi cột có tên chứa "media_id" (cover_media_id,
--   panorama_media_id, gallery_media_ids, media_ids...). Dò theo tên cột thay
--   vì liệt kê cứng, để cột ảnh nào server có mà repo không biết cũng được canh.
CREATE FUNCTION pg_temp.image_fingerprint()
RETURNS TABLE (tbl text, cols text, row_count bigint, digest text)
LANGUAGE plpgsql AS $fn$
DECLARE r record;
BEGIN
  RETURN QUERY
    SELECT 'media'::text, '(toàn bộ dòng)'::text, count(*),
           md5(coalesce(string_agg(m::text, E'\n' ORDER BY m.id), ''))
      FROM media m;

  FOR r IN
    SELECT c.table_name::text AS table_name,
           string_agg(quote_ident(c.column_name), ', ' ORDER BY c.column_name) AS col_list
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
     WHERE c.table_schema = 'public'
       AND t.table_type = 'BASE TABLE'
       AND c.table_name <> 'media'
       AND c.column_name LIKE '%media_id%'
     GROUP BY c.table_name
     ORDER BY c.table_name
  LOOP
    RETURN QUERY EXECUTE format(
      'SELECT %L::text, %L::text, count(*),
              md5(coalesce(string_agg(row(t.id, %s)::text, E''\n'' ORDER BY t.id), ''''))
         FROM %I t',
      r.table_name, r.col_list, r.col_list, r.table_name);
  END LOOP;
END
$fn$;

-- sites trước tiên, bằng đúng mức khoá mà ALTER TABLE của 015 sẽ cần, để không
-- phải nâng khoá giữa chừng (nâng khoá là chỗ dễ deadlock với API).
LOCK TABLE sites IN ACCESS EXCLUSIVE MODE;

-- SHARE chặn mọi INSERT/UPDATE/DELETE nhưng vẫn cho đọc: bản đồ vẫn xem được
-- trong lúc chạy, chỉ trang quản trị ảnh phải đợi vài giây.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT DISTINCT tbl FROM pg_temp.image_fingerprint() LOOP
    EXECUTE format('LOCK TABLE %I IN SHARE MODE', t);
  END LOOP;
END
$$;

CREATE TEMP TABLE image_before ON COMMIT DROP AS
  SELECT * FROM pg_temp.image_fingerprint();
SQL

  echo "$BASELINE_SQL"
  echo
  echo "-- ===== $TARGET (bỏ BEGIN;/COMMIT; riêng) ====="
  sed -e '/^BEGIN;$/d' -e '/^COMMIT;$/d' "$TARGET_FILE"
  echo "-- ===== hết $TARGET ====="

  cat <<SQL

CREATE TEMP TABLE image_after ON COMMIT DROP AS
  SELECT * FROM pg_temp.image_fingerprint();

\\echo
\\echo 'Đối chiếu dữ liệu ảnh trước/sau:'
SELECT coalesce(b.tbl, a.tbl)            AS "bảng",
       coalesce(b.cols, a.cols)          AS "cột ảnh",
       b.row_count                       AS "dòng trước",
       a.row_count                       AS "dòng sau",
       CASE WHEN a.digest IS NOT DISTINCT FROM b.digest
             AND a.row_count IS NOT DISTINCT FROM b.row_count
            THEN 'giữ nguyên' ELSE 'BỊ THAY ĐỔI' END AS "kết quả"
  FROM image_before b
  FULL JOIN image_after a ON a.tbl = b.tbl AND a.cols = b.cols
 ORDER BY 1;

DO \$\$
DECLARE changed text;
BEGIN
  SELECT string_agg(coalesce(b.tbl, a.tbl), ', ') INTO changed
    FROM image_before b
    FULL JOIN image_after a ON a.tbl = b.tbl AND a.cols = b.cols
   WHERE a.digest IS DISTINCT FROM b.digest
      OR a.row_count IS DISTINCT FROM b.row_count;
  IF changed IS NOT NULL THEN
    RAISE EXCEPTION 'Du lieu anh bi thay doi o bang: % - huy toan bo transaction, CSDL giu nguyen', changed;
  END IF;
END
\$\$;

-- 000 cũng vừa chạy trong transaction này, ghi luôn để migrate.sh không coi nó
-- là còn chờ.
INSERT INTO schema_migrations (filename)
  VALUES ('000_migration_ledger.sql'), ('$TARGET')
  ON CONFLICT (filename) DO NOTHING;

\\echo
\\echo 'Site sau nâng cấp:'
SELECT count(*)                                                  AS "tổng site",
       count(*) FILTER (WHERE position_lat IS NULL OR position_lng IS NULL) AS "thiếu toạ độ",
       count(*) FILTER (WHERE boundary IS NOT NULL)              AS "có ranh giới",
       count(*) FILTER (WHERE boundary_source = 'seed')          AS "nguồn seed"
  FROM sites;

$FINISH
SQL
} | psql_db -q || die "Transaction bị huỷ, CSDL KHÔNG thay đổi gì. Đọc lỗi ở trên."

echo
if [ "$DRY_RUN" = 1 ]; then
  echo "CHẠY THỬ THÀNH CÔNG. Mọi thay đổi đã ROLLBACK, CSDL y nguyên."
  echo "Chạy thật: bash scripts/upgrade-2026-09-ranh-gioi.sh${COMPOSE_FILE_ARG:+ -f $COMPOSE_FILE_ARG}"
else
  echo "XONG. 015 đã áp dụng, dữ liệu ảnh được xác nhận giữ nguyên."
  echo "Tiếp theo: dựng lại API bằng mã mới (docker compose build api && docker compose up -d api)."
  echo "Kiểm tra sổ ghi: bash scripts/migrate.sh --status"
fi
