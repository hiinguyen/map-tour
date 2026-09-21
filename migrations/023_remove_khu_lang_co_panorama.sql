-- Xoá ảnh 360 (panorama) của "Khu làng cổ" trong làng Ước Lễ theo yêu cầu
-- người dùng. Site này chưa từng có ảnh 360 thật — vẫn đang giữ ảnh CC0 Poly
-- Haven tạm từ migrations/001 ("Small Rural Road" by Andreas Mischok), và
-- migrations/008 (dòng 21-22) đã ghi chú rõ là chưa có ảnh thật thay thế.
-- File vật lý map-tour/public/panoramas/khu-lang-co.jpg bị xoá cùng lúc
-- (ngoài migration này, qua `git rm`).
--
-- Idempotent: chỉ null panorama_media_id nếu vẫn đang trỏ đúng placeholder cũ
-- (không đụng nếu đã được người dùng gắn ảnh 360 thật khác sau đó), rồi xoá
-- dòng media placeholder nếu không còn site nào tham chiếu tới.

UPDATE sites
SET panorama_media_id = NULL
WHERE name = 'Khu làng cổ'
  AND village_id = (SELECT id FROM villages WHERE slug = 'lang-uoc-le')
  AND panorama_media_id = (SELECT id FROM media WHERE url = '/panoramas/khu-lang-co.jpg');

DELETE FROM media m
WHERE m.url = '/panoramas/khu-lang-co.jpg'
  AND NOT EXISTS (
    SELECT 1 FROM sites s WHERE s.panorama_media_id = m.id OR s.cover_media_id = m.id
  );
