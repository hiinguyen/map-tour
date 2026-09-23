-- Sổ ghi migration đã áp dụng.
--
-- Vì sao cần.
-- Trước đây quy ước là "mọi migration viết idempotent, cứ chạy lại toàn bộ".
-- Quy ước đó vỡ từ khi có 015: nó đặt sites.position_lat/lng thành NOT NULL,
-- trong khi 004_seed_sites.sql lại seed hai hàng kind='area' với position NULL
-- (đúng với ràng buộc CŨ ở init/02_schema.sql, sai với ràng buộc MỚI). Chạy lại
-- 004 trên một CSDL đã có 015 sẽ đổ ở chính hai hàng đó.
--
-- Không sửa được bằng cách viết lại 004, vì trên một CSDL trống 004 chạy TRƯỚC
-- 015, lúc đó ràng buộc cũ lại buộc area phải có position NULL. Hai ràng buộc
-- loại trừ nhau, nên không có nội dung 004 nào thoả cả hai thời điểm.
--
-- Cách giải đúng là mỗi migration chỉ chạy đúng một lần. Bảng này ghi lại tên
-- file đã chạy; scripts/migrate.sh và scripts/migrate.ps1 đọc nó để bỏ qua
-- những file đã áp dụng.
--
-- CSDL đã tồn tại từ trước bảng này phải được đánh dấu một lần bằng
-- `bash scripts/migrate.sh --baseline`, nếu không script sẽ tưởng chưa có gì
-- chạy và thử chạy lại từ 001.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS.

-- File này chạy ở MỖI lần gọi migrate.sh để bảo đảm sổ ghi tồn tại, nên hạ mức
-- log để không in "relation already exists, skipping" mỗi lần.
SET client_min_messages = warning;

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE schema_migrations IS
  'Tên file trong migrations/ đã được áp dụng. Do scripts/migrate.sh ghi.';
