-- 10 sản phẩm nghề truyền thống (phần hướng khách), trải trên 6 làng.
-- Idempotent: UPSERT theo id cố định.

INSERT INTO "craft_products" ("id", "village_id", "name", "product_group", "start_period", "is_traditional", "cultural_link_level", "materials", "product_story", "process_description", "process_media_ids", "gift_suitability", "has_experience_activity", "experience_duration", "has_demo_space", "has_display_area", "has_guide_staff", "sales_channels", "main_market", "created_at", "updated_at")
VALUES
  ('56f955bc-6786-4afe-b19d-607c21417a1f', '01000000-0000-0000-0000-000000000001', 'Tương', 'Sản phẩm chế biến', 'khoảng 1920', true, 'rất cao', 'gạo nếp, đậu tương', NULL, 'Có 2 bước chính:
Đồ xôi làm mốc: gạo ngâm khoảng 12 tiếng (qua đêm), cho vào đồ ở nồi hơi, rồi tãi ra nong, khoảng 3 ngày, ngày nào cũng phải bóp nhỏ ra để lên men vi sinh tự nhiên. Khoảng 3 ngày cho vào chiêu (vo gạo, đã) phần lông mốc đi (lông mốc tơ, nấm không đúng). Rồi cho vào ủ mật, chuyển từ tinh bột sang đường Gluco. Khoảng 7-8 ngày sẽ ra mật, ngọt. Cho vào trộn với muối và nước sạch, đánh lên sánh như chè bà cốt. Nước khoan ở độ sâu 76m, bơm lên bể phơi rồi qua bể lọc mới được sử dụng làm tương. 
Nước đậu: chọn đậu đều hạt, cho vào rang (máy), chín vàng, để nguội rồi nghiền vỡ, xong cho vào luộc, cho ra thùng nhôm cho nguội, rồi đổ vào chum, ngày nào cũng phải khoắng lên, cho chuyển hóa. Để 10-15 ngày cho chuyển vị ngọt ngọt. 
Sau đó trộn đậu với phần làm mốc, với tỷ lệ vừa phải, được tương chưa xay. Sau đó xay nhuyễn, cho vào chum phơi. Không được để nước vào. 
Vị của mốc và nước đậu do kinh nghiệm biết lúc nào đạt.', NULL, 'Phù hợp', true, '30''', true, false, true, ARRAY['Có Đại lý', 'khách đến tận nơi']::text[], 'Cả nước', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('d7b4ad1e-464b-4f45-9abd-83d211020568', '01000000-0000-0000-0000-000000000001', 'Miến', 'Chế biến nông sản thực phẩm', '1986', true, 'Rất cao', 'bột dong', NULL, 'Đầu tiên phải lọc bột dong, cho nước vào đánh lên, các phần cặn ở giữa, tạp chất ở trên thì bỏ, chỉ lấy bột ở giữa. Sau đó đánh bột dùng máy đánh. Sau khi đánh xong cho vào lò nhiệt hấp chín, sau đó nhả bánh ra phên rồi đem phơi, tùy thời tiết, nếu trời nắng thì 3-4 tiếng, phơi tái rồi thu vào. Sau đó đem về xắt miếng (có máy) cho vừa máy cắt sợi, xắt thành các miếng 20cm. Sau đó cho vào máy cắt thành sợi, tiếp tục vắt ra phên mang ra phơi khô. Sau khi khô thì quấn thành thành phẩm.
Cả quy trình khoảng 1-2 ngày', NULL, 'Phù hợp', false, 'không', true, false, false, ARRAY['Đại lý', 'đến lấy tại xưởng', 'giao cửa hàng quen']::text[], 'Trong và ngoài tỉnh', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('cee1b1d2-6f30-44ff-9862-e8c6a0cffe90', 'fdd98e46-3b65-490d-aadc-dbb90eab321d', '- Tranh sơn mài
 - Các vật dụng trang trí: Lọ hoa, đĩa trưng bày', 'Sản phẩm thủ công mỹ nghệ (Nhóm gốm sứ và thủy tinh; Nhóm thêu và dệt; Nhóm mây tre lá; Nhóm đá gỗ mỹ nghệ sơn mài khảm trai; Nhóm khác (sừng, kim khó, hoa, tranh,…)', '2003', true, 'Sản phẩm mang đậm giá trị văn hóa nghề truyền thống lâu đời của làng', 'Vỏ trứng vịt ấp nở, vỏ chai, tre, lứa, gỗ, bột màu,
 sơn phủ, bột son, sơn ta, sơn hạt điều, gốm sứ', NULL, 'Sản phẩm nếu làm bằng Sơn ta sẽ mất 3 - 6 tháng,
 còn làm bằng Sơn điều mất 1,5 tháng (vì đây là sơn hóa chất)
 1. Chuẩn bị chất liệu nền (Phôi): Sản phẩm sơn mài không chỉ làm trên một chất liệu cố định mà được thực hiện trên nhiều loại bề mặt nền khác nhau: Tre, gỗ và gốm sứ
 
 2. Chuẩn bị nguyên liệu phủ và tạo màu:
 - Sơn đang được sử dụng 2 loại chính là Sơn ta và Sơn hạt điều.
 - Để tạo nên các mảng màu và họa tiết, người thợ kết hợp sử dụng bột son, bột màu, cùng với các chất liệu quý như vàng, bạc.
 - Đối với vỏ trứng (Khảm trứng): Đây là một khâu chế biến nguyên liệu rất đặc biệt. Thay vì dùng vỏ trứng thông thường, người thợ sử dụng vỏ trứng vịt đã nở (nguồn cung chủ yếu nhập từ Trung Quốc hoặc Singapore). Trước khi khảm lên bề mặt, vỏ trứng sẽ được đem đi nướng để tạo ra các dải màu sắc đậm nhạt khác nhau theo ý đồ của bức tranh.
 
 3. Thời gian hoàn thiện: Thời gian để hoàn thành một quy trình sản xuất phụ thuộc hoàn toàn vào loại sơn được sử dụng ban đầu: Sơn ta từ 3-6 tháng; Sơn hạt điều rút ngắn đnags kể thời gian, chỉ mất 1.5 tháng để hoàn thành sản phẩm vì Sơn hạt điều có sự can thiệp của các hóa chất giúp bề mặt sơn khô nhanh hơn', NULL, 'Rất phù hợp', true, '~30 phút', false, true, NULL, ARRAY['Từ 2021', 'khách sẽ tự đến xem hàng
 và đặt mua tại cơ sở']::text[], 'Chủ yếu là trong Hà Nội, ít khi có đơn ở các tỉnh', '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('e6e001cc-263b-416c-84b9-3303d54a8097', 'fdd98e46-3b65-490d-aadc-dbb90eab321d', '- Tranh sơn mài
 - Các vật dụng trang trí: Lọ hoa, đĩa trưng bày
 - Vận dụng gia đình', 'Sản phẩm thủ công mỹ nghệ (Nhóm mây tre lá; Nhóm đá gỗ mỹ nghệ sơn mài khảm trai)', 'Anh Cường bắt đầu làm từ năm 2008', true, '0.5', 'Vỏ trứng vịt ấp nở, vỏ chai, tre, lứa, gỗ, bột màu,
 sơn phủ, bột son, sơn ta, sơn hạt điều, gốm sứ', NULL, 'Bước 1: Mộc gỗ
 Bước 2: Thảo sơn
 Bước 3: Đánh vải
 Bước 4: Bó bước 1
 Bước 5: Mài bó
 Bước 6: Hom sơn 1 / Khảm trai
 Bước 7: Kẹt sơn tràn
 Bước 8: Mài hom
 Bước 9: Lót sơn
 Bước 10: Kẹt lót
 Bước 11: Mài kẹt lót
 Bước 12: Thí sơn 1 / Khảm trứng
 Bước 13: Mài thí 1
 Bước 14: Kẹt lỗi
 Bước 15: Mài kẹt
 Bước 16: Thí sơn 2
 Bước 17: Mài thí 2
 Bước 18: Kẹt lỗi
 Bước 19: Mài kẹt lỗi
 Bước 20: Phun màu 1
 Bước 21: Mài màu 1
 Bước 22: Kẹt lỗi
 Bước 23: Mài kẹt lỗi
 Bước 24: Phun màu 2
 Bước 25: Mài màu 2
 Bước 26: Vẽ tay
 Bước 27: Mạ Thép vàng/thép bạc
 Bước 28: Toát bóng
 Bước 29: Đánh bóng', NULL, 'Rất phù hợp', true, '~40 phút', true, true, true, ARRAY['Sản phẩm chủ yếu được xuất sang Pháp (đối tác từ năm 2015)', 'Đức', 'Mỹ. Khách nước ngoài thường phải đặt hàng trước từ 2 tháng (đi máy bay) đến 4-6 tháng (đi tàu biển).']::text[], 'Sản phẩm chủ yếu được xuất sang Pháp (đối tác từ năm 2015), Đức, Mỹ. Khách nước ngoài thường phải đặt hàng trước từ 2 tháng (đi máy bay) đến 4-6 tháng (đi tàu biển).', '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('1b45e114-a6ce-4379-a897-26169e410a95', '09ee09b0-41f2-429c-a515-0cd2592edc44', 'Mây tre nón lá — Cơ sở sản xuất kinh doanh nón lá Lê Văn Tuy', 'Nhóm  mây tre nón lá', '1975', true, 'Rất cao', 'Vòng, cạp, vòng cữ, lá cọ non, lá cọ già, mo, cước khâu', 'Không', 'Rẽ lá, là lá- bứt vòng-quay nón-khâu(thắt nón)-nức cạp-luồn nhôi-hoàn thiện', NULL, 'Rất phù hợp', true, '30-60 phút', false, true, true, ARRAY['Tại cơ sở', 'Khách du lịch']::text[], 'Ngoài tỉnh, thành phố', '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('5f329317-32e8-4051-8957-fc6e3ad01e31', '09ee09b0-41f2-429c-a515-0cd2592edc44', 'Mây tre nón lá — Hợp tác xã mây tre nón lá Thu Hương', 'Mây tre nón lá', '1986', true, 'Rất cao', 'Vòng tre, mo, lá lụi, lá cọ, cước', 'Không', 'Rẽ lá-Là-bứt vòng-quay non- khâu(thắt)-lồng nhôi nón', NULL, 'Rất phù hợp', true, 'Trên 60 phút', true, true, true, ARRAY['Tại cơ sở', 'Đại lý', 'siêu thị', 'Sàn thương mại điện tử', 'Xuất khẩu', 'khách du lịch', 'trạm dừng chân']::text[], 'Ngoài tỉnh, thành phố, quốc tế', '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('53c85b12-e2af-4d24-a6a4-6f41a57a371a', 'c33319de-4845-41bf-94c1-3fa501e5e867', 'Complet - Veston — Hùng Luyến Comple Veston', 'Quần áo Vest', '1990', true, 'Rất cao', 'Vải, mếch, mùng, cảng quần, dũi', 'Nguồn lao động thông minh sáng tạo', 'Trước hết thợ sẽ lấy số đo cẩn thận rồi vẽ rập theo từng người. Sau đó chọn vải, cắt vải, ép keo tạo dáng và may ráp từng bộ phận của áo, quần. Khi may xong sẽ là định hình, đính cúc, làm khuy, kiểm tra lại từng đường kim mũi chỉ rồi sẽ ra thành thành phẩm', NULL, 'Rất phù hợp', true, 'Trên 60 phút', true, true, true, ARRAY['Tại cơ sở']::text[], 'Trong tỉnh, thành phố', '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('726a0782-41bc-4d11-bd84-36b5d042b15e', 'c33319de-4845-41bf-94c1-3fa501e5e867', 'Complet - Veston — Doanh nghiệp may Complet veston D&T', 'Quần áo comple', '2009', true, 'Cao', 'Vải, mùng, lót, dựng, mếch, kem, bông', 'Bắt nguồn từ làng truyền thống', 'Trước hết thợ sẽ lấy số đo cẩn thận rồi vẽ rập theo từng người. Sau đó chọn vải, cắt vải, ép keo tạo dáng và may ráp từng bộ phận của áo, quần. Khi may xong sẽ là định hình, đính cúc, làm khuy, kiểm tra lại từng đường kim mũi chỉ rồi sẽ ra thành thành phẩm', NULL, 'Rất phù hợp', true, 'Tùy vào nhu cầu khách muốn trải nghiệm (thông thường khoảng 30 phút)', false, true, true, ARRAY['Tại cơ sở', 'đại lý', 'siêu thị', 'khách du lịch']::text[], 'Ngoài tỉnh, thành phố', '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('1bb19045-ea18-4f64-9235-021d72a313a8', '8216fe86-f66d-4b19-904b-cbdee0bf1eba', 'Mây tre đan', 'Mây, tre, lá, cỏ', '1973 / 1991 (Công ty)', true, 'Rất cao', 'Mây, tre, lá, cỏ', NULL, 'Giáo trình thực hiện', NULL, 'Rất phù hợp', true, 'Ít nhất 4 tiếng', true, true, true, ARRAY['Tại cơ sở', 'Xuất khẩu']::text[], 'Quốc tế', '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('7149b013-e68d-4f69-9a0c-7a141d92b38a', '00000000-0000-0000-0000-000000000001', 'Giò chả', 'Sản phẩm chế biến thực phẩm', '2021', true, 'Cao', 'Thịt lợn', NULL, 'Làm từ thịt lợn tươi, còn nóng, với các khâu lọc, xay, gói. Gói giò bằng lá chuối, để giò thơm ngon, dậy mùi. Lá chuối cũng phải chọn kỹ, lá nõn lần trong, lá bánh tẻ lần giữa, lá già lần ngoài. Giò gói xong đem thả ngay vào nồi nước sôi và luộc, tùy theo cỡ giò mà có thời gian vớt thích hợp.', NULL, 'Phù hợp làm quà lưu niệm, nhất là các du khách muốn trải nghiệm đặc sản địa phương', true, 'Dưới 30''', true, false, true, ARRAY['Đại lý', 'Chợ', 'khách quen đến mua']::text[], 'Trong xã', '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z')
ON CONFLICT (id) DO UPDATE SET
  "village_id" = EXCLUDED."village_id",
  "name" = EXCLUDED."name",
  "product_group" = EXCLUDED."product_group",
  "start_period" = EXCLUDED."start_period",
  "is_traditional" = EXCLUDED."is_traditional",
  "cultural_link_level" = EXCLUDED."cultural_link_level",
  "materials" = EXCLUDED."materials",
  "product_story" = EXCLUDED."product_story",
  "process_description" = EXCLUDED."process_description",
  "process_media_ids" = EXCLUDED."process_media_ids",
  "gift_suitability" = EXCLUDED."gift_suitability",
  "has_experience_activity" = EXCLUDED."has_experience_activity",
  "experience_duration" = EXCLUDED."experience_duration",
  "has_demo_space" = EXCLUDED."has_demo_space",
  "has_display_area" = EXCLUDED."has_display_area",
  "has_guide_staff" = EXCLUDED."has_guide_staff",
  "sales_channels" = EXCLUDED."sales_channels",
  "main_market" = EXCLUDED."main_market",
  "created_at" = EXCLUDED."created_at",
  "updated_at" = EXCLUDED."updated_at";
