-- Migration cũ 024_fix_panorama_covers.sql (và bản viết lại 011) chỉ sửa
-- `media.kind` theo tỉ lệ pixel thực tế cho media thuộc sở hữu `sites`.
-- 8 dòng dưới đây thuộc `heritage_buildings`/`decorative_art_items` nên không
-- nằm trong phạm vi đó và vẫn mang kind='panorama' sai: chúng được importer
-- gắn cờ 360 chỉ vì nhãn/ô lân cận trong workbook có chữ "360" (xem
-- isPanoramaLabel trong scripts/lib/villagePhotoImport.ts), trong khi ảnh thật
-- là ảnh phẳng thông thường — đã kiểm chứng bằng tỉ lệ pixel (equirectangular
-- phải đúng 2:1; 8 ảnh này ở 1.90–2.09) và bằng nội dung ảnh (chân tảng, bát
-- hương, mái, nền lát gạch, vì nóc, mặt đứng nhà cổ...).
--
-- Hệ quả khi chưa sửa: services/villages.ts dựng `photos` bằng
-- `filter(kind === 'anh')` nên 8 ảnh này biến mất khỏi thư viện ảnh của công
-- trình/hiện vật, đồng thời là ứng viên cho `panorama` (lấy dòng panorama đầu
-- tiên) — nếu ảnh 360 thật bị xoá hoặc đổi created_at thì PanoramaViewer sẽ
-- dựng ảnh phẳng lên mặt cầu 360 và hiển thị méo.
--
-- Idempotent: chỉ UPDATE các dòng còn kind='panorama'; chạy lại nhiều lần vô hại.
-- Không đụng tới ảnh 360 thật (57 dòng đạt đúng tỉ lệ 2:1).

UPDATE media SET kind = 'anh'
WHERE kind = 'panorama'
  AND url IN (
    '/cu-da/heritage-buildings/chua-cu-da-linh-minh-tu-4f9067b2-29.png',
    '/cu-da/decorative/do-te-khi-bat-huong-dinh-mam-bong-dai-do-chap-kich-lo-bo-lac-chau-phong-chau-02e6073b-1.jpg',
    '/ha-thai/heritage-buildings/nha-co-afe0acd9-13.jpg',
    '/ha-thai/heritage-buildings/dinh-ha-thai-con-co-ten-goi-la-dinh-ba-lay-09758e11-33.jpg',
    '/ha-thai/heritage-buildings/dinh-ha-thai-con-co-ten-goi-la-dinh-ba-lay-09758e11-34.jpg',
    '/ha-thai/decorative/vi-noc-gian-bien-bbd2f4b0-1.jpg',
    '/phu-vinh/decorative/do-trang-tri-tho-tu-gan-tren-bo-khung-kien-truc-hoanh-phi-cuon-thu-cau-doi-cua-vong-thieu-chau-y-mon-e9217b60-1.jpg',
    '/uoc-le/heritage-buildings/nha-cu-kha-3-44000000-11.jpg'
  );
