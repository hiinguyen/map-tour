# Đợt cập nhật 09/2026: ranh giới khuôn viên và nhập KML

Tài liệu này hướng dẫn chạy đợt cập nhật lên một hệ thống đang chạy.
Nếu đang cài mới hoàn toàn thì không cần đọc, cứ làm theo phần "Chạy lần đầu" trong [`../README.md`](../README.md).

## Đợt này thay đổi gì

**Một site giờ có thể vừa có toạ độ điểm vừa có ranh giới.**
Trước đây `sites` buộc chọn một trong hai: `kind='point'` thì có toạ độ và không có ranh giới, `kind='area'` thì ngược lại.
Hệ quả là đình, chùa, nhà thờ không thể vừa hiện marker bấm được trên bản đồ tổng thể vừa hiện đúng hình dạng và diện tích khuôn viên.
Bất biến mới: mọi site đều có toạ độ, ranh giới là tuỳ chọn, và `kind='area'` khi và chỉ khi có ranh giới.

**Nhập ranh giới hàng loạt từ Google My Maps.**
Có trang quản trị `/admin/kml` và công cụ dòng lệnh `scripts/import-kml.ts` để nạp file KML/KMZ.
Trình nhập tự khớp từng polygon với site đã có trong CSDL theo tên, khoảng cách và danh mục.

**Bản sửa tay được bảo vệ.**
Cột mới `boundary_source` ghi nguồn gốc của ranh giới: `seed`, `kml`, hoặc `admin`.
Lần nhập KML sau sẽ bỏ qua và báo "được bảo vệ" với hàng nào đang là `admin`, nên sửa tay trong trang quản trị không bị ghi đè.

**Dòng khớp không chắc chắn phải xác nhận tay.**
Polygon nào khớp mơ hồ với nhiều site sẽ được liệt kê riêng và **không** được ghi cho tới khi người dùng chọn tay từng dòng.
Đây là điểm quan trọng nhất về an toàn dữ liệu: trước đây hệ thống tự chọn ứng viên điểm cao nhất, nghĩa là một cú bấm có thể gán ranh giới vào nhầm địa danh mà không ai biết.

**Trang chi tiết địa danh có mục "Quy mô khuôn viên".**
Một bản đồ khoá, không thu phóng được, vẽ đúng tỷ lệ thật kèm chip diện tích và thước tỷ lệ.
Site chưa khảo sát ranh giới thì hiện vòng tròn nét đứt phỏng đoán, có ghi rõ đó không phải ranh giới thực.

**Camera chỉ di chuyển khi cần.**
Bấm một ghim đang hiện rõ giữa khung thì bản đồ không giật nữa.
Bấm từ danh sách bên trái hoặc mở link sâu thì vẫn khung lại như cũ.

## Thay đổi CSDL

Toàn bộ nằm trong hai file, đều idempotent:

| File | Nội dung |
|---|---|
| `migrations/000_migration_ledger.sql` | Bảng `schema_migrations` ghi lại migration nào đã chạy |
| `migrations/015_sites_position_and_footprint.sql` | Bỏ ràng buộc hình học cũ, thêm `boundary_source` và `boundary_updated_at`, backfill toạ độ, đặt `position_lat/lng` thành `NOT NULL`, thêm ràng buộc và index mới |

### Vì sao lần này có sổ ghi migration

Quy ước cũ là "mọi migration viết idempotent, cứ chạy lại toàn bộ".
Quy ước đó vỡ từ 015.

`004_seed_sites.sql` seed hai hàng `kind='area'` với toạ độ `NULL`, đúng với ràng buộc cũ.
015 đặt `position_lat/lng` thành `NOT NULL`.
Chạy lại 004 trên CSDL đã có 015 sẽ đổ ngay ở hai hàng đó.

Không sửa được bằng cách viết lại 004: trên CSDL trống, 004 chạy **trước** 015, lúc đó ràng buộc cũ lại buộc `area` phải có toạ độ `NULL`.
Hai ràng buộc loại trừ nhau nên không có nội dung 004 nào thoả cả hai thời điểm.

Cách giải là mỗi migration chỉ chạy đúng một lần, do `schema_migrations` theo dõi.

## Các bước chạy

### 1. Sao lưu, bắt buộc

```bash
bash scripts/backup.sh          # Windows: .\scripts\backup.ps1
```

Không có bước này thì không làm bước nào tiếp theo.
015 đặt `NOT NULL` lên cột đang có dữ liệu, đây là thay đổi không tự lùi lại được.

### 2. Lấy mã mới và dựng lại API

```bash
git pull origin main
docker compose build api
```

### 3. Đánh dấu baseline, chỉ làm MỘT lần

Hệ thống đang chạy đã áp dụng 001 tới 014 từ trước, nhưng sổ ghi mới tinh nên chưa biết điều đó.
Nếu bỏ qua bước này, script sẽ tưởng chưa có gì chạy và thử chạy lại từ 001, rồi đổ ở 004.

Đánh dấu tất cả là đã chạy, **kể cả 015**, rồi gỡ riêng 015 ra để nó được chạy thật:

```bash
bash scripts/migrate.sh --baseline
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "DELETE FROM schema_migrations WHERE filename = '015_sites_position_and_footprint.sql';"
```

Windows:

```powershell
.\scripts\migrate.ps1 -Baseline
docker compose exec -T postgres psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB `
  -c "DELETE FROM schema_migrations WHERE filename = '015_sites_position_and_footprint.sql';"
```

Kiểm tra lại trước khi chạy:

```bash
bash scripts/migrate.sh --dry-run
```

Kết quả đúng phải là đúng một file: `015_sites_position_and_footprint.sql`.

### 4. Áp dụng migration

```bash
bash scripts/migrate.sh         # Windows: .\scripts\migrate.ps1
```

Nếu có site nào thiếu toạ độ, 015 sẽ dừng với thông báo đếm rõ số hàng thiếu thay vì đổ khó hiểu ở bước `SET NOT NULL`.
Bổ sung toạ độ cho những hàng đó rồi chạy lại.

Kiểm tra:

```bash
bash scripts/migrate.sh --status
```

### 5. Khởi động lại và kiểm tra

```bash
docker compose up -d postgres api
cd map-tour && npm install && npm run dev
```

Mở `http://localhost:5173`, vào trang chi tiết một địa danh có ranh giới và xác nhận mục "Quy mô khuôn viên" hiện ra kèm chip diện tích và thước tỷ lệ.

## Nhập ranh giới từ KML

Chỉ làm sau khi đã xong bước 4.
File KML nguồn của sáu làng nằm sẵn trong `map-tour/server/kml_data/`.

### Cách 1: trang quản trị, khuyến nghị

1. Đặt `ADMIN_IMPORT_KEY` trong `.env` nếu chưa có, rồi khởi động lại API. Không đặt biến này thì mọi route `/api/admin/*` bị tắt.
2. Mở `http://localhost:5173/admin/kml`.
3. Chọn làng, tải file KML lên, xem bản xem trước.
4. Bản xem trước chia bốn nhóm: khớp chắc chắn, **khớp mơ hồ**, không khớp, và bị từ chối.
5. Với nhóm khớp mơ hồ, chọn tay địa danh cho từng dòng. Nút commit bị khoá cho tới khi chọn xong hoặc bạn chấp nhận bỏ qua chúng.
6. Bấm commit. Bản tóm tắt trả về số dòng đã cập nhật, đã tạo, được bảo vệ, bị bỏ qua vì trùng, và bị bỏ qua vì chưa chọn.

### Cách 2: dòng lệnh

```bash
cd map-tour/server
npx tsx scripts/import-kml.ts lang-uoc-le server/kml_data/lang-uoc-le.kml --dry-run
npx tsx scripts/import-kml.ts lang-uoc-le server/kml_data/lang-uoc-le.kml
```

Nhận cả slug lẫn UUID của làng.
Luôn chạy `--dry-run` trước để xem trình nhập định làm gì.

### Nhập lại cùng một file là an toàn

Trình nhập idempotent: nạp lại đúng file đó cho kết quả y hệt, không tạo bản sao.
Hàng nào đang là `boundary_source='admin'` được giữ nguyên và báo là được bảo vệ.

## Lùi lại nếu hỏng

015 không tự lùi được vì nó đặt `NOT NULL` và đổi ràng buộc.
Cách lùi duy nhất là phục hồi từ bản sao lưu ở bước 1:

```bash
bash scripts/restore.sh backups/<file>.sql.gz
```

Rồi `git checkout` về commit trước và dựng lại API.

## Kiểm tra sau khi chạy

```bash
cd map-tour/server && npm test      # 76 ca, phải xanh hết
cd map-tour/server && npm run build
cd map-tour && npx tsc -b
```

Kiểm tra nhanh trên CSDL:

```sql
-- Mọi site đều phải có toạ độ
SELECT count(*) FROM sites WHERE position_lat IS NULL OR position_lng IS NULL;   -- phải ra 0

-- kind phải khớp với việc có ranh giới hay không
SELECT count(*) FROM sites WHERE (kind = 'area') <> (boundary IS NOT NULL);      -- phải ra 0

-- Phân bố nguồn gốc ranh giới
SELECT boundary_source, count(*) FROM sites WHERE boundary IS NOT NULL GROUP BY 1;
```
