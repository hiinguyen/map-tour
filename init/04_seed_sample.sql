-- Dữ liệu mẫu (KHÔNG phải dữ liệu khảo sát thật) — dùng để kiểm tra schema
-- hoạt động đúng sau khi triển khai, đồng thời làm dữ liệu backend cho ứng
-- dụng map-tour (xem map-tour/server). Tái sử dụng đúng các entry demo đã có
-- trong map-tour/src/data/sites.ts (bản cũ, tĩnh). Toạ độ cổng làng lấy đúng
-- theo Google Maps (xem villages.google_maps_link); toạ độ 5 điểm/khu vực
-- còn lại là ước lượng tương đối quanh cổng làng, KHÔNG phải GPS khảo sát
-- từng điểm — xem migrations/003_update_coordinates.sql để biết cách quy đổi.
-- Muốn bỏ seed này khi triển khai thật: xoá hoặc đổi tên file thành .sql.disabled
-- trước lần "docker compose up" đầu tiên (init script chỉ chạy khi volume rỗng).

INSERT INTO villages (id, name, admin_location, google_maps_link, main_occupations)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Làng Ước Lễ',
  'Xã Tân Ước, huyện Thanh Oai, Hà Nội',
  'https://www.google.com/maps/@20.8259091,105.810058,18z',
  ARRAY['Làm giò chả truyền thống']
);

-- Ảnh 360° minh hoạ (Poly Haven, CC0) — placeholder cho tới khi có ảnh khảo sát
-- thực tế. File vật lý được map-tour serve tĩnh từ public/panoramas/*.jpg,
-- nên url ở đây là đường dẫn tương đối trên chính domain frontend.
INSERT INTO media (id, url, kind, attribution, owner_entity_type, owner_entity_id)
VALUES
  ('10000000-0000-0000-0000-000000000001', '/panoramas/cong-lang-uoc-le.jpg', 'panorama',
   '"Courtyard" by Greg Zaal (CC0, Poly Haven)', 'sites', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '/panoramas/dinh-lang-uoc-le.jpg', 'panorama',
   '"Old Room" by Sergej Majboroda (CC0, Poly Haven)', 'sites', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003', '/panoramas/chua-lang-uoc-le.jpg', 'panorama',
   '"Ninomaru Teien" by Greg Zaal (CC0, Poly Haven)', 'sites', '20000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000004', '/panoramas/gieng-lang.jpg', 'panorama',
   '"Pond" by Greg Zaal (CC0, Poly Haven)', 'sites', '20000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000006', '/panoramas/khu-lang-nghe-gio-cha.jpg', 'panorama',
   '"Outdoor Workshop" by Dimitrios Savva & Jarod Guest (CC0, Poly Haven)', 'sites', '20000000-0000-0000-0000-000000000006');

-- Ảnh cover phẳng (thật, chụp tại làng Ước Lễ) — dùng cho card ở trang chủ /
-- danh sách di sản, khác với ảnh 360° panorama ở trên. File vật lý phục vụ
-- tĩnh từ public/heritage/*.jpg.
INSERT INTO media (id, url, kind, owner_entity_type, owner_entity_id)
VALUES
  ('30000000-0000-0000-0000-000000000001', '/heritage/cong-lang.jpg', 'anh', 'sites', '20000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '/heritage/dinh-lang.jpg', 'anh', 'sites', '20000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003', '/heritage/chua-lang.jpg', 'anh', 'sites', '20000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000004', '/heritage/gieng-lang.jpg', 'anh', 'sites', '20000000-0000-0000-0000-000000000004'),
  ('30000000-0000-0000-0000-000000000005', '/heritage/khu-lang.jpg', 'anh', 'sites', '20000000-0000-0000-0000-000000000005'),
  ('30000000-0000-0000-0000-000000000006', '/heritage/khu-lang-gio-cha.jpg', 'anh', 'sites', '20000000-0000-0000-0000-000000000006');

INSERT INTO sites (id, village_id, kind, position_lat, position_lng, name, category, short_description, panorama_media_id, cover_media_id)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'point', 20.8259091, 105.810058,
   'Cổng làng Ước Lễ', 'Di tích kiến trúc',
   'Cổng làng cổ xây gạch từ thời Mạc, biểu tượng nổi tiếng nhất của làng.',
   '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'point', 20.826409, 105.810958,
   'Đình làng Ước Lễ', 'Di tích tín ngưỡng',
   'Nơi thờ Thành hoàng làng, diễn ra các lễ hội và sinh hoạt cộng đồng truyền thống.',
   '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'point', 20.826809, 105.811058,
   'Chùa làng Ước Lễ', 'Di tích tín ngưỡng',
   'Ngôi chùa cổ của làng, điểm sinh hoạt Phật giáo và tham quan văn hóa tâm linh.',
   '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'point', 20.826109, 105.810658,
   'Giếng làng', 'Cảnh quan',
   'Giếng nước cổ gắn với đời sống sinh hoạt lâu đời của người dân trong làng.',
   '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004');

INSERT INTO sites (id, village_id, kind, boundary, name, category, short_description, panorama_media_id, cover_media_id)
VALUES
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'area',
   '[[20.826209,105.810158],[20.826909,105.810558],[20.826709,105.811358],[20.825809,105.811258],[20.825509,105.810458]]'::jsonb,
   'Khu làng cổ', 'Quần thể di sản',
   'Cụm nhà cổ, ngõ xóm lát gạch nghiêng và không gian kiến trúc truyền thống vùng đồng bằng sông Hồng.',
   NULL, '30000000-0000-0000-0000-000000000005'),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'area',
   '[[20.824609,105.811058],[20.825009,105.811658],[20.824409,105.812158],[20.823909,105.811558]]'::jsonb,
   'Khu làng nghề giò chả', 'Làng nghề',
   'Cụm xưởng sản xuất giò chả truyền thống, nơi khách có thể tham quan quy trình chế biến.',
   '10000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006');
