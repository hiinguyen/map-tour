-- Đồng bộ schema với các thay đổi từng được thêm rải rác qua nhiều migration
-- cũ (005, 011, 025): cột slug/cover_media_id cho villages, cột village_id
-- cho heritage_buildings. Gộp lại một chỗ vì init/02_schema.sql không được
-- sửa lại sau khi đã có dữ liệu thật (xem docs/trien-khai.md).
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.

ALTER TABLE villages ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS cover_media_id uuid REFERENCES media (id) ON DELETE SET NULL;

ALTER TABLE heritage_buildings ADD COLUMN IF NOT EXISTS village_id uuid REFERENCES villages (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_heritage_buildings_village_id ON heritage_buildings (village_id);
