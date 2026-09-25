-- Cho phép một site có ĐỒNG THỜI toạ độ điểm (marker) và ranh giới (footprint).
-- Nhà thờ / sân đình cần hiện đúng hình dạng + diện tích, nhưng vẫn phải có
-- marker để bấm trên bản đồ tổng thể. Trước đây chk_sites_geometry
-- (init/02_schema.sql:156-160) buộc chọn một trong hai.
--
-- Bất biến mới:
--   * MỌI site đều có position (NOT NULL)
--   * boundary là tuỳ chọn
--   * kind = 'area'  KHI VÀ CHỈ KHI  boundary IS NOT NULL
--
-- kind được giữ lại (4 chỗ hiển thị badge + thống kê villages.ts đang đọc nó)
-- nhưng bị ràng buộc tương đương với "có boundary", nên nó không thể nói sai.
-- Không dùng GENERATED vì cột generated từ chối INSERT giá trị tường minh, mà
-- migrations/004_seed_sites.sql:6 có truyền kind — sẽ phá tính idempotent.
--
-- Idempotent: DROP ... IF EXISTS / ADD COLUMN IF NOT EXISTS / UPDATE theo id.

BEGIN;

ALTER TABLE sites DROP CONSTRAINT IF EXISTS chk_sites_geometry;

-- Nguồn gốc của ranh giới, để lần nhập KML sau KHÔNG ghi đè bản đã sửa tay
-- trong trang quản trị. Trình nhập bỏ qua và báo "được bảo vệ" với các hàng
-- có boundary_source = 'admin'.
ALTER TABLE sites ADD COLUMN IF NOT EXISTS boundary_source text;
ALTER TABLE sites DROP CONSTRAINT IF EXISTS chk_sites_boundary_source;
ALTER TABLE sites ADD CONSTRAINT chk_sites_boundary_source CHECK (
  boundary_source IS NULL OR boundary_source IN ('seed', 'kml', 'admin')
);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS boundary_updated_at timestamptz;

-- Backfill position cho 2 hàng 'area' duy nhất (004_seed_sites.sql:12-13).
-- Giá trị = polygonCentroid() (src/types.ts:149-170, trọng số theo diện tích)
-- tính sẵn ngoài SQL, nên marker hiện ra ĐÚNG chỗ TourMap.tsx:526 đang vẽ
-- (siteCenter -> polygonCentroid) — hiển thị không thay đổi.
--   'Khu làng cổ'            -> 20.826231, 105.810776  (13 405,5 m²)
--   'Khu làng nghề giò chả'  -> 20.824480, 105.811627  ( 7 107,3 m²)
-- Hai cặp số này được canh bởi test server/src/lib/geo.test.ts — nếu ai sửa
-- polygonCentroid mà quên sửa đây thì test đỏ.
UPDATE sites SET position_lat = 20.826231, position_lng = 105.810776
 WHERE id = '20000000-0000-0000-0000-000000000005'
   AND (position_lat IS NULL OR position_lng IS NULL);

UPDATE sites SET position_lat = 20.824480, position_lng = 105.811627
 WHERE id = '20000000-0000-0000-0000-000000000006'
   AND (position_lat IS NULL OR position_lng IS NULL);

-- Mọi site 'area' CÒN LẠI thiếu toạ độ: tính polygonCentroid() ngay trong SQL,
-- cùng công thức với server/src/lib/geo.ts (trọng số theo diện tích, vòng suy
-- biến diện tích 0 thì lấy trung bình đỉnh). Cần vì CSDL thật không nhất thiết
-- đi từ seed 004: server production có "Khu làng cổ" / "Khu làng nghề giò chả"
-- với UUID ngẫu nhiên, hai UPDATE theo id cố định phía trên không chạm tới.
-- boundary phải có dạng [[lat, lng], ...]. Site nào có dù chỉ một phần tử sai
-- dạng thì KHÔNG tính (bỏ riêng phần tử đó sẽ làm lệch vòng, ra tâm sai mà
-- không ai biết); nó vẫn thiếu toạ độ và bị khối DO phía dưới chặn kèm tên.
WITH pts AS (
  SELECT s.id, p.ord,
         (p.pt->>0)::double precision AS lat,
         (p.pt->>1)::double precision AS lng,
         count(*) OVER (PARTITION BY s.id) AS n
    FROM sites s
    CROSS JOIN LATERAL jsonb_array_elements(s.boundary) WITH ORDINALITY AS p(pt, ord)
   WHERE s.kind = 'area'
     AND (s.position_lat IS NULL OR s.position_lng IS NULL)
     AND jsonb_typeof(s.boundary) = 'array'
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(s.boundary) e
        WHERE jsonb_typeof(e) <> 'array'
           OR jsonb_array_length(e) < 2
           OR jsonb_typeof(e->0) <> 'number'
           OR jsonb_typeof(e->1) <> 'number')
),
edges AS (
  SELECT a.id, a.lat AS lat1, a.lng AS lng1, b.lat AS lat2, b.lng AS lng2,
         a.lng * b.lat - b.lng * a.lat AS cross_product
    FROM pts a
    JOIN pts b ON b.id = a.id AND b.ord = a.ord % a.n + 1
),
centroids AS (
  SELECT id,
         sum(cross_product) / 2                AS area,
         sum((lat1 + lat2) * cross_product)    AS lat_moment,
         sum((lng1 + lng2) * cross_product)    AS lng_moment,
         avg(lat1)                             AS mean_lat,
         avg(lng1)                             AS mean_lng
    FROM edges
   GROUP BY id
)
UPDATE sites s
   SET position_lat = CASE WHEN c.area = 0 THEN c.mean_lat ELSE c.lat_moment / (6 * c.area) END,
       position_lng = CASE WHEN c.area = 0 THEN c.mean_lng ELSE c.lng_moment / (6 * c.area) END
  FROM centroids c
 WHERE s.id = c.id;

UPDATE sites SET boundary_source = 'seed'
 WHERE boundary IS NOT NULL AND boundary_source IS NULL;

-- Nếu còn hàng nào thiếu toạ độ thì dừng hẳn migration. Thà fail với thông báo
-- đọc được hơn là để ALTER ... SET NOT NULL phía dưới fail khó hiểu.
DO $$
DECLARE missing int; names text;
BEGIN
  SELECT count(*), string_agg(name || ' (' || id || ')', '; ' ORDER BY name)
    INTO missing, names
    FROM sites
   WHERE position_lat IS NULL OR position_lng IS NULL;
  IF missing > 0 THEN
    RAISE EXCEPTION 'Con % site chua co toa do diem - bo sung truoc khi chay 015: %', missing, names;
  END IF;
END $$;

ALTER TABLE sites ALTER COLUMN position_lat SET NOT NULL;
ALTER TABLE sites ALTER COLUMN position_lng SET NOT NULL;

-- kind = 'area'  <=>  boundary IS NOT NULL.
-- Ràng buộc này là toàn bộ mục đích của việc giữ cột kind: nó biến "quên cập
-- nhật kind" thành lỗi ồn ào thay vì dữ liệu sai âm thầm. KHÔNG được bỏ vì tiện.
ALTER TABLE sites ADD CONSTRAINT chk_sites_geometry CHECK (
  (kind = 'area') = (boundary IS NOT NULL)
);

-- Tra cứu "site nào đã có footprint" cho báo cáo nhập KML và cho thống kê
-- areaCount ở server/src/services/villages.ts.
CREATE INDEX IF NOT EXISTS idx_sites_with_boundary
  ON sites (village_id) WHERE boundary IS NOT NULL;

COMMIT;
