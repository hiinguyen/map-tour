# Triển khai CSDL Postgres (Docker) - Làng Ước Lễ

Tài liệu này hướng dẫn cài đặt CSDL đã thiết kế trong [`thiet-ke-csdl.md`](./thiet-ke-csdl.md) / [`thiet-ke-csdl.docx`](./thiet-ke-csdl.docx) lên **PostgreSQL chạy trong container Docker**, trên một server Linux thật. Toàn bộ file cấu hình/script nằm ngay tại gốc project này (`lang-uoc-le-db/`).

**Phạm vi:** đây là một **project CSDL độc lập**, không thuộc và không phụ thuộc vào bất kỳ ứng dụng frontend cụ thể nào (ví dụ map-tour). Tài liệu này chỉ triển khai **tầng CSDL**. Muốn một ứng dụng nào đó đọc/ghi dữ liệu, cần xây thêm một backend/API riêng kết nối tới Postgres này - không thuộc phạm vi tài liệu này.

## 1. Cấu trúc thư mục

```
lang-uoc-le-db/
├── docker-compose.yml      # định nghĩa service Postgres (+ Adminer tùy chọn)
├── .env.example            # mẫu biến môi trường - copy thành .env
├── .gitignore              # loại .env và backups/ khỏi git
├── init/                   # script SQL, tự chạy khi container khởi tạo lần đầu
│   ├── 01_extensions.sql
│   ├── 02_schema.sql       # toàn bộ 10 bảng
│   ├── 03_roles.sql        # role đọc/ghi riêng cho backend
│   └── 04_seed_sample.sql  # dữ liệu mẫu, có thể xóa/tắt trước khi triển khai thật
├── migrations/             # thay đổi schema sau khi đã có dữ liệu thật, chạy tay
├── scripts/
│   ├── deploy.sh           # khởi động/khởi động lại container
│   ├── migrate.sh          # áp dụng migration chưa chạy (xem mục 5)
│   ├── backup.sh           # pg_dump ra file .sql.gz
│   ├── restore.sh          # restore từ file backup
│   └── psql-shell.sh       # mở psql shell tương tác
├── docs/
│   ├── thiet-ke-csdl.md    # thiết kế schema + lý do thiết kế
│   ├── thiet-ke-csdl.docx  # báo cáo dạng bảng (STT/Tên/FK-PK/Kiểu/Chức năng/Mẫu/Ghi chú)
│   └── trien-khai.md       # chính tài liệu này
└── backups/                # (tự tạo khi backup, không commit)
```

## 2. Yêu cầu hệ thống trên server

- Server Linux (Ubuntu 22.04/24.04 hoặc tương đương), quyền `sudo`.
- **Docker Engine ≥ 24** và **Docker Compose plugin v2** (`docker compose`, không phải `docker-compose` v1).
  ```bash
  docker --version
  docker compose version
  ```
  Nếu chưa có, cài theo hướng dẫn chính thức: https://docs.docker.com/engine/install/
- Tối thiểu ~1 vCPU / 1GB RAM cho riêng Postgres ở quy mô dữ liệu 1 làng; dung lượng đĩa tùy số lượng ảnh/bản vẽ lưu qua `media.url` (bản thân file ảnh nên lưu ở object storage/S3-compatible hoặc thư mục tĩnh, DB chỉ lưu URL - xem mục 8).
- Mở/đóng firewall theo mục 6 (Bảo mật).

## 3. Triển khai lần đầu

```bash
# 1. Đưa mã nguồn project này lên server, ví dụ qua git clone hoặc rsync
git clone <repo-url> lang-uoc-le-db
cd lang-uoc-le-db

# 2. Tạo file .env thật từ mẫu, rồi đổi mật khẩu
cp .env.example .env
nano .env   # đổi POSTGRES_PASSWORD sang giá trị mạnh, ngẫu nhiên

# 3. (Tùy chọn) đổi mật khẩu role backend trong init/03_roles.sql
#    trước lần khởi tạo đầu tiên - script init chỉ chạy 1 lần khi volume rỗng
nano init/03_roles.sql   # đổi 'change_me_app_password'

# 4. (Tùy chọn) nếu KHÔNG muốn dữ liệu mẫu demo, xóa hoặc đổi tên file seed
#    trước khi lên (init script chỉ chạy khi volume rỗng, nên phải làm TRƯỚC bước 5)
rm init/04_seed_sample.sql

# 5. Chạy
chmod +x scripts/*.sh
bash scripts/deploy.sh
```

`deploy.sh` sẽ pull image, khởi động container `lang-uoc-le-db`, và chờ đến khi Postgres báo "sẵn sàng" (health check `pg_isready`).

## 4. Kiểm tra sau khi triển khai

```bash
# Container đang chạy và healthy?
docker compose ps

# Xem log nếu có lỗi
docker compose logs postgres

# Vào psql kiểm tra bảng đã tạo đủ chưa
bash scripts/psql-shell.sh
```

Trong psql:
```sql
\dt                        -- phải thấy 10 bảng: villages, sites, heritage_buildings, ...
SELECT count(*) FROM sites; -- nếu còn seed mẫu: ra 6
\q
```

## 5. Cập nhật schema sau này (migration)

Script trong `init/` **chỉ chạy đúng 1 lần**, khi Postgres khởi tạo trên một volume rỗng (`lang_uoc_le_pgdata`). Sau khi đã có dữ liệu thật, muốn thay đổi schema (thêm cột, đổi kiểu, thêm bảng...) thì **không sửa lại file trong `init/`** - thay vào đó tạo file mới trong `migrations/NNN_mo_ta_thay_doi.sql`.

Migration **không tự chạy**. Áp dụng bằng script:

```bash
bash scripts/backup.sh           # luôn sao lưu trước, không có ngoại lệ
bash scripts/migrate.sh --status # xem file nào đã chạy, file nào chưa
bash scripts/migrate.sh --dry-run
bash scripts/migrate.sh
```

Windows dùng `.\scripts\migrate.ps1` với các tham số `-Status`, `-DryRun`, `-Baseline`.

Bảng `schema_migrations` (tạo bởi `migrations/000_migration_ledger.sql`) ghi lại file nào đã áp dụng, nên **mỗi migration chỉ chạy đúng một lần**. Đây không phải lựa chọn phong cách: `015_sites_position_and_footprint.sql` đặt `sites.position_lat/lng` thành `NOT NULL`, còn `004_seed_sites.sql` lại seed hàng `kind='area'` với toạ độ `NULL` theo ràng buộc cũ, nên chạy lại toàn bộ sẽ đổ ở 004. Chi tiết trong phần đầu của `000_migration_ledger.sql`.

Một CSDL đã tồn tại từ trước khi có sổ ghi cần đánh dấu **một lần duy nhất**:

```bash
bash scripts/migrate.sh --baseline
```

Lệnh này chỉ ghi nhận, không chạy file nào. Xem [`cap-nhat-2026-09-ranh-gioi-kml.md`](cap-nhat-2026-09-ranh-gioi-kml.md) cho quy trình đầy đủ của đợt cập nhật gần nhất.

## 6. Bảo mật khi triển khai thật

- **Đổi `POSTGRES_PASSWORD`** trong `.env` sang giá trị ngẫu nhiên mạnh (ví dụ `openssl rand -base64 24`) - không dùng giá trị mẫu.
- **Đổi mật khẩu role `lang_uoc_le_readwrite`** trong `init/03_roles.sql` trước lần khởi tạo đầu tiên; đây là role backend/API nên dùng để kết nối, không dùng `POSTGRES_USER` (superuser) cho ứng dụng.
- **Không expose cổng 5432 ra internet công khai.** Nếu backend chạy trên cùng server/Docker network, nên bỏ mapping `ports:` của service `postgres` trong `docker-compose.yml` (chỉ giữ kết nối qua Docker network nội bộ). Nếu vẫn cần expose cho công cụ quản trị từ xa, giới hạn bằng firewall:
  ```bash
  sudo ufw allow from <ip-tin-cậy> to any port 5432 proto tcp
  sudo ufw deny 5432
  ```
- **Không commit `.env`** - đã có trong `.gitignore`.
- **Adminer** (`docker compose --profile tools up -d adminer`) chỉ nên bật tạm thời khi cần quản trị qua giao diện, và đặt sau reverse proxy có xác thực (Basic Auth/VPN) nếu expose ra ngoài - không để chạy thường trực trên internet mở.
- **Backup định kỳ**: thêm cron trên server, ví dụ backup hằng ngày 2h sáng:
  ```bash
  crontab -e
  # thêm dòng:
  0 2 * * * cd /path/to/lang-uoc-le-db && bash scripts/backup.sh >> backups/backup.log 2>&1
  ```

## 7. Vận hành hằng ngày

| Việc cần làm | Lệnh |
|---|---|
| Khởi động lại sau khi sửa `.env`/`docker-compose.yml` | `bash scripts/deploy.sh` |
| Backup thủ công | `bash scripts/backup.sh` |
| Restore từ 1 file backup | `bash scripts/restore.sh backups/<file>.sql.gz` |
| Mở psql để chạy SQL trực tiếp | `bash scripts/psql-shell.sh` |
| Dừng container (giữ dữ liệu) | `docker compose stop` |
| Xóa hẳn container + dữ liệu (nguy hiểm) | `docker compose down -v` |

## 8. Về việc lưu file media (ảnh/bản vẽ/panorama)

Bảng `media` (xem `init/02_schema.sql`) chỉ lưu `url` + metadata, **không lưu binary ảnh trong Postgres**. Khi triển khai thật, file ảnh/bản vẽ nên đặt ở một trong hai nơi rồi ghi URL tương ứng vào `media.url`:

- Thư mục tĩnh do web server (frontend đang tiêu thụ dữ liệu này) serve, hoặc Nginx riêng - đơn giản, phù hợp quy mô 1 làng.
- Object storage (S3-compatible: MinIO tự host, hoặc dịch vụ cloud) - phù hợp nếu sau này mở rộng nhiều làng/nhiều ảnh.

Việc dựng object storage nằm ngoài phạm vi tài liệu này; ghi chú lại để không quên khi lên kế hoạch triển khai đầy đủ.
