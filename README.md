# map-tour

Hệ thống bản đồ di sản làng nghề vùng đồng bằng sông Hồng.
Gồm ba phần chạy cùng nhau: cơ sở dữ liệu PostgreSQL, API đọc/ghi dữ liệu, và ứng dụng web hiển thị bản đồ.

Dữ liệu hiện có sáu làng: Ước Lễ, Cự Đà, Hạ Thái, Làng Chuông, Lang Cuu, Phú Vinh.

## Kiến trúc

```
Trình duyệt (Vite, cổng 5173)
      │  fetch /api/*
      ▼
API Express (map-tour/server, cổng 8787)
      │  pg
      ▼
PostgreSQL 16 (Docker, cổng lấy từ .env)
```

Ngoài ra có hai dịch vụ phụ:

- `osrm` cho tính năng chỉ đường đi bộ, tự host, không publish port ra ngoài.
- `adminer` là giao diện quản trị CSDL nhẹ, chỉ bật khi cần bằng profile `tools`.

## Thư mục

| Đường dẫn | Nội dung |
|---|---|
| `init/` | Script khởi tạo CSDL, **chỉ chạy một lần** khi volume Postgres còn rỗng |
| `migrations/` | Thay đổi schema sau khi đã có dữ liệu thật, chạy tay theo thứ tự số |
| `scripts/` | Triển khai, migration, sao lưu, phục hồi, mở psql (bản `.sh` cho Linux/macOS và `.ps1` cho Windows) |
| `map-tour/` | Ứng dụng web React + TypeScript + Vite |
| `map-tour/server/` | API Express, gồm cả trình nhập dữ liệu Excel và KML |
| `map-tour/server/kml_data/` | File KML nguồn của từng làng, xuất từ Google My Maps |
| `docs/` | Thiết kế CSDL, hướng dẫn triển khai, hướng dẫn từng đợt cập nhật |

## Chạy lần đầu

Cần Docker và Node.js 20 trở lên.

**Linux/macOS:**

```bash
cp .env.example .env        # rồi đổi POSTGRES_PASSWORD và ADMIN_IMPORT_KEY
chmod +x scripts/*.sh
bash scripts/deploy.sh      # dựng Postgres
bash scripts/migrate.sh     # áp dụng toàn bộ migration theo thứ tự
docker compose up -d api
cd map-tour && npm install && npm run dev
```

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env   # rồi đổi POSTGRES_PASSWORD và ADMIN_IMPORT_KEY
.\scripts\deploy.ps1
.\scripts\migrate.ps1
docker compose up -d api
cd map-tour; npm install; npm run dev
```

Mở địa chỉ Vite in ra terminal, mặc định `http://localhost:5173`.
Vite proxy sẵn `/api` sang `http://localhost:8787`, đổi bằng biến `VITE_API_PROXY_TARGET` nếu API chạy nơi khác.

**Bắt buộc:** `init/` chỉ tạo schema gốc.
Mọi thay đổi sau đó nằm trong `migrations/`, và chúng **không tự chạy**.
Bỏ bước áp dụng migration thì API sẽ lỗi vì thiếu cột.

## Dữ liệu bản đồ nền

Bản đồ nền dùng MapLibre GL JS đọc trực tiếp file `map-tour/public/tiles/vietnam.pmtiles`.
File này khoảng 570 MB nên **không nằm trong git**.
Khi dựng máy mới phải copy tay vào đúng đường dẫn đó, nếu không bản đồ sẽ trắng.

Chi tiết về schema OpenMapTiles, style và glyph: xem [`map-tour/README.md`](map-tour/README.md).

## Dịch vụ chỉ đường

Chuẩn bị dữ liệu định tuyến một lần trước khi bật service `osrm`:

```bash
bash map-tour/routing/build.sh     # Windows: .\map-tour\routing\build.ps1
docker compose up -d osrm api
```

Script tải bản đồ OSM Việt Nam từ Geofabrik, cắt vùng quanh làng, rồi xử lý qua `osrm-extract`, `osrm-partition`, `osrm-customize`.
Chỉ cần chạy lại khi muốn cập nhật dữ liệu đường.

## Nhập dữ liệu

Có ba đường nhập dữ liệu, dùng cho ba loại nguồn khác nhau.

| Nguồn | Công cụ | Ghi chú |
|---|---|---|
| File Excel khảo sát từng làng | `npx tsx scripts/import-village-data.ts` | Nhập phần chữ: hồ sơ làng, câu chuyện lịch sử, công trình, hiện vật trang trí, sản phẩm nghề |
| Ảnh đính kèm trong Excel | `npx tsx scripts/import-<lang>-photos.ts` | Mỗi làng một script vì bố cục sheet khác nhau |
| File KML/KMZ từ Google My Maps | Trang `/admin/kml` hoặc `npx tsx scripts/import-kml.ts` | Nhập toạ độ điểm và ranh giới khuôn viên |

Toàn bộ chạy trong `map-tour/server/`.
Các route `/api/admin/*` yêu cầu header `x-admin-key` khớp biến `ADMIN_IMPORT_KEY` trong `.env`.
Không đặt biến đó thì các route admin bị tắt hoàn toàn.

## Sao lưu và phục hồi

Luôn sao lưu trước mọi thao tác ghi vào dữ liệu thật.

```bash
bash scripts/backup.sh                          # ra backups/<db>_<timestamp>.sql.gz
bash scripts/restore.sh backups/<file>.sql.gz
bash scripts/psql-shell.sh                      # mở psql vào container
```

Thư mục `backups/` nằm trong `.gitignore`.

## Tài liệu

- [`docs/thiet-ke-csdl.md`](docs/thiet-ke-csdl.md) thiết kế schema và lý do từng quyết định.
- [`docs/trien-khai.md`](docs/trien-khai.md) triển khai bằng Docker, sao lưu, bảo mật.
- [`docs/cap-nhat-2026-09-ranh-gioi-kml.md`](docs/cap-nhat-2026-09-ranh-gioi-kml.md) hướng dẫn chạy đợt cập nhật ranh giới khuôn viên và nhập KML.
- [`map-tour/README.md`](map-tour/README.md) chi tiết frontend, bản đồ nền, ảnh 360 độ.
- [`map-tour/server/README.md`](map-tour/server/README.md) chi tiết API và biến môi trường.

## Kiểm thử

```bash
cd map-tour/server && npm test    # vitest, 76 ca
cd map-tour/server && npm run build
cd map-tour && npx tsc -b
```
