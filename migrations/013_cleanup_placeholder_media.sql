-- Dọn các dòng media placeholder (Poly Haven CC0) do init/04_seed_sample.sql
-- tạo cho 6 site mẫu ban đầu, hiện không còn site/village/hồ sơ kỹ thuật nào
-- trỏ tới nữa sau khi migration 012 đã gán lại đúng ảnh thật (hoặc NULL nếu
-- site đó chưa có ảnh thật) — xoá cho gọn theo đúng tinh thần migrations cũ
-- 023_remove_khu_lang_co_panorama.sql (chỉ xoá dòng KHÔNG còn được tham chiếu).
-- Idempotent: DELETE có điều kiện NOT EXISTS — chạy lại nhiều lần vô hại.

DELETE FROM media m
WHERE (m.id::text LIKE '10000000-0000-0000-0000-%' OR m.id::text LIKE '30000000-0000-0000-0000-%')
  AND NOT EXISTS (SELECT 1 FROM sites s WHERE s.cover_media_id = m.id OR s.panorama_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM villages v WHERE v.cover_media_id = m.id OR v.morphology_diagram_media_id = m.id)
  AND NOT EXISTS (
    SELECT 1 FROM heritage_building_technical_details t
    WHERE t.floor_plan_drawing_media_id = m.id OR t.section_drawing_media_id = m.id
  );
