-- 241 đề tài mỹ thuật trang trí / hiện vật cổ, gắn theo building_id.
-- Idempotent: UPSERT theo id cố định.

INSERT INTO "decorative_art_items" ("id", "building_id", "theme_group", "subject_name", "era_estimate", "description", "media_ids", "created_at", "updated_at")
VALUES
  ('01659d8d-8e45-40dc-a5d9-90db7dca3e2e', 'bf94d200-fd5c-46ea-a1fb-2cb52eb4797c', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'Vân hoá long

Cốn mê chạm nổi họa tiết mây hóa rồng (vân hóa long), với đầu rồng hòa quyện trong các dải vân mây cách điệu. Họa tiết mang ý nghĩa cát tường, linh thiêng và cầu mong mưa thuận gió hòa.

Lá hoá long

Vì nách chạm lộng họa tiết lá hóa long, kết hợp đầu rồng cách điệu với các dải lá và dây cuốn mềm mại. Họa tiết mang ý nghĩa cát tường, bảo hộ', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('0ff87038-f4d1-4bde-89cf-5f1a8b6b1242', 'bf94d200-fd5c-46ea-a1fb-2cb52eb4797c', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'Hương án', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('14d8c02c-2e8f-4b4a-9060-a0ec7f1fffa9', '3ee3bd85-6227-4c96-ba05-ff8b2b74034d', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'Hoành phi, câu đối

Hoành phi và câu đối được làm bằng gỗ, chạm khắc hoa văn và sơn thếp vàng, tạo vẻ trang nghiêm, cổ kính. Đây là những thành phần quan trọng trong không gian thờ cúng, thể hiện sự tôn kính tổ tiên, giáo dục đạo hiếu và gìn giữ truyền thống tốt đẹp của gia đình, dòng họ.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('19826bca-07d4-47e5-ac35-5263406d4084', 'bf94d200-fd5c-46ea-a1fb-2cb52eb4797c', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'Hoành phi

Hoành phi được treo ở vị trí trung tâm gian thờ, nền sơn son thếp vàng. Hoành phi không chỉ xác định tên gọi của không gian thờ tự mà còn thể hiện sự tôn kính đối với tổ tiên, góp phần tạo nên vẻ trang nghiêm và bề thế cho nội thất.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('365483cc-e9db-4cf8-9651-4b05777c6cba', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'khám thờ

hương án

bài vị

Đồ tự khí là nhóm hiện vật phục vụ trực tiếp cho hoạt động thờ tự trong các cơ sở tín ngưỡng, tôn giáo, dùng để tôn trí đối tượng thờ cúng và tạo không gian thờ tự trang nghiêm. Nhóm này bao gồm các loại hình tiêu biểu như hương án, khám thờ, ngai thờ, bài vị, giữ vai trò quan trọng trong nghi lễ, tín ngưỡng và giá trị văn hóa của di tích.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('44715bfb-72f0-40bb-a9a8-286544d594de', '98dbb779-b90c-469b-bc18-8179a8158231', 'phong_thuy_cat_tuong', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán)', NULL, 'Tượng Hộ pháp đắp nổi hình võ tướng mặc giáp, tay cầm binh khí, mang ý nghĩa canh giữ, trấn trạch và bảo vệ sự linh thiêng của công trình thờ tự.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('48fbd63b-11fa-44f1-945a-bb3e128d02ec', '98dbb779-b90c-469b-bc18-8179a8158231', 'phong_thuy_cat_tuong', 'Lưỡng long chầu nhật', NULL, 'Lưỡng long ở đỉnh mái

Bờ nóc mái đắp nổi hình lưỡng long chầu nhật. Hai rồng đối xứng chầu vào mặt nhật ở trung tâm, thân uốn lượn theo mái, mang ý nghĩa cát tường, quyền uy và cầu mong quốc thái dân an.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('49a757b7-1fb0-46ba-ab5f-039fbb1f410b', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'Tượng thờ mẫu', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('58333609-f92c-4c17-8306-fa1f4559b873', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'Tượng Phật

Ban tượng Đức ông + 2 vị hậu cần

Là các tượng thể hiện các đức Phật, Bồ Tát, La Hán, Kim Cương, Hộ Pháp và các nhân vật thuộc hệ thống tín ngưỡng Phật giáo. Tượng được thờ trong các chùa nhằm phục vụ nhu cầu tín ngưỡng, tu tập và giáo hóa Phật pháp.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('590fe53a-b778-453f-b37d-b6e6ba6cdc5f', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'hoành phi

hoành phi2

Đồ trang trí thờ tự gắn trên bộ khung kiến trúc: Là các hiện vật trang trí và thờ tự được gắn, treo trên hệ thống cột, xà, kèo, cửa trong công trình tín ngưỡng, tôn giáo, nhằm tôn vinh đối tượng thờ cúng và tăng tính trang nghiêm, mỹ thuật cho không gian thờ tự. Bao gồm: hoành phi, câu đối, cuốn thư, cửa võng, thiều châu, y môn,...', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('5af94691-44e4-4647-9e78-089b4b12cee8', '98dbb779-b90c-469b-bc18-8179a8158231', 'doi_song_sinh_hoat', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'Cuốn thư', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('5f395108-0961-4d4e-962c-6cd053b4fbb9', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'Lá hoá long

Vì nách chạm lộng họa tiết lá hóa long, kết hợp đầu rồng cách điệu với các dải lá và dây cuốn mềm mại. Họa tiết mang ý nghĩa cát tường, bảo hộ', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('68f79baf-1f0e-4722-b720-ca74a5478748', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'doi_song_sinh_hoat', 'Mây', NULL, 'Mây: Họa tiết mây được thể hiện bằng các đường nét uyển chuyển, mềm mại, tượng trưng cho sự giao hòa giữa trời và đất, mang ý nghĩa cát tường, thanh cao và tạo vẻ đẹp linh thiêng cho kiến trúc truyền thống.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('6f910e60-0347-4268-942a-388ab37598bc', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'Biểu tượng thiêng: không gian chùa giếng
 Biểu tượng Tôn giáo: các tượng thờ Phật giáo', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('8683e6bc-502f-403f-b994-99d76e4c5cce', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'tin_nguong_ton_giao', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'Rồng ở đỉnh mái

Long (Rồng): Linh vật biểu tượng cho quyền uy, sức mạnh và thịnh vượng. Tạo hình thân dài uốn lượn mềm mại, được chạm nổi hoặc chạm lộng tinh xảo với các chi tiết vảy, râu, bờm đặc sắc, thể hiện giá trị nghệ thuật và văn hóa truyền thống Việt Nam.

Nghê ở trước hiên

Tượng nghê đá có dáng ngồi chầu, đầu ngẩng cao, mắt tròn lồi, miệng há, bờm xoắn và đuôi cong. Tượng được đặt trước bậc thềm công trình, mang ý nghĩa trấn giữ, bảo hộ và thể hiện sự uy nghiêm của không gian thờ tự.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('91b30cb6-9a23-48eb-8033-0c303ebf01ce', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'bát hương, mâm bồng

Hệ thống đồ tế khí được bố trí theo nguyên tắc đối xứng truyền thống. Chính giữa là bát hương và khám thờ sơn son thếp vàng, hai bên có hạc thờ, chân nến và bình hoa tạo nên không gian trang nghiêm. Nổi bật nhất là đôi hạc chầu hai bên án thờ, biểu tượng cho sự thanh khiết, trường tồn và ước vọng hướng tới cõi thiêng. Các đồ thờ chủ yếu mang phong cách truyền thống Bắc Bộ với chất liệu gỗ sơn son thếp vàng, đồng và gốm sứ.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('9480a1e4-f49f-498f-ad50-f9dc919a715a', '3ee3bd85-6227-4c96-ba05-ff8b2b74034d', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'Cửa sổ trang trí các ô gốm hình Tùng – Cúc – Trúc – Mai biểu trưng cho bốn mùa và những phẩm chất cao đẹp như trường thọ, thanh cao, chính trực và sức sống bền bỉ', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('b202144b-01cb-48ae-af6c-23253bf34387', '3ee3bd85-6227-4c96-ba05-ff8b2b74034d', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'Hương án', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('b56dcb41-f10d-4ab9-805d-9efcb01079ff', '98dbb779-b90c-469b-bc18-8179a8158231', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'Vì nách hoạ tiết rồng

Vì nách gỗ chạm khắc hình rồng trong mây, kết hợp với vân mây, thuỷ ba thể hiện ý nghĩa cát tường và bảo hộ . Cùng với đó là nghệ thuật chạm khắc tinh xảo của kiến trúc gỗ truyền thống

Lá hoá rồng

Vì nách chạm lá hóa rồng, với đầu rồng cách điệu kết hợp các dải lá và dây cuốn mềm mại. Họa tiết mang ý nghĩa cát tường, bảo hộ', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('b86cdb24-cd1a-4cd9-9a97-f2b75e79a885', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'Hoa quả: Hình tượng mẫu đơn, hoa hồng, hoa cúc, hoa đào, quả lựu được thể hiện với đường nét mềm mại, giàu tính trang trí, tượng trưng cho phú quý, trường thọ, hạnh phúc, may mắn và sự sinh sôi, sung túc trong đời sống văn hóa truyền thống.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('d474c8c4-7e3a-4f4a-8e15-13db1453ac6b', 'bf94d200-fd5c-46ea-a1fb-2cb52eb4797c', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'Bát hương', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('e0929f69-0ea6-454a-8447-b112c95878a3', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'doi_song_sinh_hoat', 'Tiên', NULL, 'Tiên: Hình tượng tiên gắn với đời sống tín ngưỡng dân gian, biểu trưng cho sự thanh cao, an lành và ước vọng về cuộc sống hạnh phúc, tốt đẹp.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('e7700e21-0a29-4bb2-8382-0d0472723e85', '98dbb779-b90c-469b-bc18-8179a8158231', 'doi_song_sinh_hoat', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'bát hương', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('ee362050-0e08-471c-8b7a-595749815888', '98dbb779-b90c-469b-bc18-8179a8158231', 'tin_nguong_ton_giao', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'Con nghê ở đỉnh cột

Nghê đá đặt trên đỉnh cột trụ biểu trong tư thế ngồi chầu, mang ý nghĩa trấn giữ, bảo hộ không gian thờ tự, xua đuổi tà khí và cầu mong bình an, cát tường.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('eefd5277-aa1f-4507-b2b4-4fbe2174a6a7', 'bf94d200-fd5c-46ea-a1fb-2cb52eb4797c', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'Bát bửu đạo giáo

Cốn mê chạm nổi mô típ pháp bảo (Bát bửu) kết hợp vân mây, mang ý nghĩa trấn trạch, bảo hộ và cầu mong bình an, cát tường.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('ef4c41da-336e-4377-9952-3b0a7fe5ecd0', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'tượng sư tổ

tượng Tổ', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('fe86923e-b8ed-4b2a-8e5a-b0b7a35ef5dc', '3ee3bd85-6227-4c96-ba05-ff8b2b74034d', 'doi_song_sinh_hoat', 'Bát tiên', NULL, 'Cửa sổ gỗ đỏ trầm trang trí các ô gốm hình Bát Tiên xen kẽ hoa văn chạm thủng dây lá, vừa tăng giá trị thẩm mỹ vừa thể hiện ý nghĩa trường thọ, cát tường và ảnh hưởng của Đạo giáo trong nghệ thuật kiến trúc truyền thống.', NULL, '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('07bfd70f-6712-4999-9706-663f10b700b7', '5b72fa35-638b-44c6-ab02-3947ba5a6102', 'phong_thuy_cat_tuong', 'Trang trí thanh Câu đầu và Thượng lương, Quá giang', NULL, 'Trang trí nhẹ nhàng, điểm xuyết cho các thanh chị lực này. Trên câu đầu bên cạnh các hoa văn hoa lá nhỏ, có thêm 2 chữ Thọ ở 2 đầu.', NULL, '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('1427d07c-9f70-4284-a467-95cc49f822d3', '2113eaa5-1727-4f3c-9f78-f2a426fda3d9', 'doi_song_sinh_hoat', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc.', NULL, 'Được trang trí bằng nhiều hình rồng, rồng vờn mây nước, mặt rồng kết hợp cây hoa lá. Nhiều bức trang trí mang phong cách nghệ thuật thế kỷ 18. Các hình tiêu biểu như Cuốn Thư, Hoành Phi, Trang trí gian chính giữa đại đình', NULL, '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('d56e89d8-654f-43ca-bdd9-42e7e66b5da4', '2113eaa5-1727-4f3c-9f78-f2a426fda3d9', 'tin_nguong_ton_giao', 'Linh vật: Rồng', NULL, 'Các đầu dư được chạm lộng hình rồng với các bờm, râu, tóc vuốt nhọn như hình mũi kiếm hay lưỡi thương rất đặc trưng của nghệ thuật thế kỷ 18 (chưa thay thế từ thời điểm khởi dựng năm 1780.).

Rồng vờn mây nước được chạm ở vì nách, Các thanh rường được trang trí, chạm nổi, chạm lộng các hoa văn hình các con rồng dày đặc, các bờm tóc vuốt nhọn như hình mũi kiếm hay lưỡi thương rất đặc trưng của nghệ thuật thế kỷ 18.', NULL, '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('e0032a1a-7e70-4a83-bf40-b9b211da13cc', '5b72fa35-638b-44c6-ab02-3947ba5a6102', 'doi_song_sinh_hoat', 'Cửa Võng, Hoành phi : Vị trí: Gian thờ chính giữa nhà.', NULL, 'Cửa Võng: phân tách không gian linh thiêng bên trong với không gian sinh hoạt bên ngoài. * Chất liệu & Kỹ thuật: gỗ chạm nổi nhiều lớp, sơn son thếp vàng rực rỡ.
* Họa tiết: Dây hoa mai, hoa cúc, kết hợp các hình tượng chim hoa uốn lượn mềm mại quanh viền cửa.                                                                                                                                                                       * Bên trên cùng là Hoành phi "Hội Nguyên Thống Tông" (會元統宗), sơn son thếp vàng nổi bật trên nền sơn then(đen bóng). Ý nghĩa: Quy tụ về một nguồn cội, nối tiếp dòng giống tổ tiên. Đây là thông điệp nhắc nhở con cháu về đạo lý Uống nước nhớ nguồn. * Vị trí: Gian thờ chính giữa nhà.                                                                                                                                                                                 * Dự đoán phong cách: Theo trang trí đồ thờ cúng cuối thời Nguyễn.', NULL, '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('e29b62b5-afff-467e-95ba-69968914723b', '5b72fa35-638b-44c6-ab02-3947ba5a6102', 'phong_thuy_cat_tuong', 'Vì nóc gian biên:', NULL, 'Sự kết hợp hài hòa giữa chạm khắc hoa văn nghệ thuật và chữ viết phong thủy: Chữ Phúc (福) ở chính giữa vì nóc, ngay bên dưới thanh đỡ thượng lương là một ô chữ Thọ cách điệu hình vuông. Tạo thành "Phúc - Thọ" (Hạnh phúc & Trường thọ). Xung quanh hai trụ ngắn và các rường cụt, câu đầu mép dưới/trên được chạm khắc hoa sen như đế đỡ cùng các dải mây cuộn và cánh hoa lá lật uốn lượn mềm mại. Đặc trưng cho phong cách trang trí thời  Nguyễn cuối thế kỷ 19.', NULL, '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('ed67fa2e-ccbf-4d40-82e4-bbd2d309ce50', '2113eaa5-1727-4f3c-9f78-f2a426fda3d9', 'tin_nguong_ton_giao', 'Linh vật: Phượng', NULL, 'Phượng được trang trí đắp nổi ở tường đầu hồi ngoài nhà và hình vẽ trên tường hậu cung.', NULL, '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('094d6f04-ff6e-4150-8f56-fce2bc7b6a2b', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'phong_thuy_cat_tuong', 'Vật báu', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('0a438f42-1343-4849-97a1-08c7979d6750', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Mây', NULL, 'ảnh mây được khắc họa trên tường

Có uốn lượn theo rồng', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('0c626934-7eff-4f9e-a2e2-b1542146287c', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('18c41fcb-b3dc-43ba-affe-23e9220e82e0', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'hóa rồng', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('1c4952e5-4cf0-4d3f-b22a-d72f0e5c222c', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('1ed161d5-1072-4320-ae6e-214b50455c2d', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'tin_nguong_ton_giao', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'rồng,phượng', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('23b4d47b-ddc2-404d-82ad-4f1600f4b985', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('28296529-a6e4-4ce5-87d8-d08c77b824a9', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Tượng Hậu Phật (trong chùa)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('2bc9f524-ebc7-44ca-a21d-4be4f7f52b0e', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Tượng Hậu Phật (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('30733a6c-6de0-4f20-94d3-3209feda00b7', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('30f780b5-adcb-4e58-9444-d0aaa1d1f0a0', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('33817625-daa0-41bb-9820-0f7720bbe69b', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('38e5915c-7c4f-4295-801a-27a8d3890792', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'phong_thuy_cat_tuong', 'Vật báu', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('3dab05b2-743b-44f0-8dc7-34135c7eb0ba', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('3f309b6e-d37c-4995-92b7-0d412b471d0d', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('46ff5e4e-f05a-4eb6-96c9-d782fbbe4064', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'ảnh bát hương, đài

Bát hương, đỉnh, mâm bồng, ...', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('475ca16b-a4f8-4c4b-8794-cce4083fc5ff', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('4918923c-945e-4453-8e4f-d4dca285b42c', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('4a6709b2-6c32-4859-90ec-c8a0af7ba2ca', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Tiên', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('4c99d071-feda-47b5-8507-b1f3ca79b4da', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'tứ linh', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('4f9f8d25-8325-4f8f-9871-7f50be582d9c', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'ảnh chụp hoành phi

hoành phi,câu đối,của võng', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('56350bf7-8bc7-46b6-a926-63e9d3cadfdd', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('6bbcb36e-2be4-4531-a469-21ea1e801c83', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('6cbe0eb7-3065-4664-8572-80ee2c6a87f9', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Mây', NULL, 'ảnh chụp điêu khắc mây

Có đi theo rồng', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('78b47e7d-cdb1-4d77-baff-216e7d0dfa58', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('790cbb1c-867d-44ac-9fe7-0d2a61ebf60b', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('79981ef6-bb2f-42cb-b9a2-d80c8565d856', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Tiên', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('7b6e2772-2ff4-4980-b802-b2d893e73b06', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('7d5af557-0d5b-4e39-9f84-1d0de0407251', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('8d798c13-b85c-41e9-9e12-c674bfb7cab6', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('90f6335b-5731-478a-b892-0f65c10cb3f6', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('91e0ec46-b80e-4734-ba6f-c8b041ca9a69', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'ảnh chụp tổng thể đồ thờ tự

bát hương,đài', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('92d59c45-a677-41c5-8632-1e49543523ae', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('95de0fb7-2ef1-45b5-993e-9db3bfe3617b', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('96179b07-2001-435d-8f03-1aacea2dc381', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'ảnh bà voi

ảnh ông voi

ông voi bà voi', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('977a9207-cba0-42b8-8c6e-0f87ef9c7cb2', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('9d07cd6f-3d76-4688-b987-fab55742376b', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('9d234bb9-2630-41ee-86c8-9333a7cd607f', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'ảnh câu đối

Có câu đối', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('a21915a2-3222-4ce4-854c-48c6c2f0c037', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('a4664fee-2c27-46b8-9289-e296cff2c855', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'ảnh chụp hương án

bài vị có ngai,kiếm', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('a56dd1ca-6bdf-4d8f-adf3-41e24d93ffd7', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('ac774557-ebf4-409e-995c-81208ee98251', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'Có voi ông voi bà', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('af053486-f75b-4e71-ad1e-2c99e65a1b8a', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'ảnh chụp bài vị

Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('af5bbb84-7d6f-4a18-a986-515ee10b505c', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('af8027b9-4256-4ad0-890c-1fec140fb6f7', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('b28d221f-cbdc-4cd6-8917-2d69332a302d', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('b86827bb-8c3d-4b16-8c5c-7b3493193a00', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('bc84df67-a6b6-4f93-add5-385f3086ae09', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('bcfa8cd5-189a-44b4-987d-e21003d37665', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'phong_thuy_cat_tuong', 'Vật báu', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('bff2bb80-a9ff-4149-a32b-0b1995744c96', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'doi_song_sinh_hoat', 'Tiên', NULL, 'Thờ thành hoàng, Đức Phùng Vương', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('c2d0a1eb-7de1-4705-801a-52cc30243fd6', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('c50d1f17-2cb0-41ab-bfaa-05e1a318b909', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'ảnh hương án

ảnh bài vị

Có ngai', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('cc7b8b83-06cd-481c-8156-e641b684f363', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'tin_nguong_ton_giao', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'ảnh rồng được điêu khắc trên hương án

rồng', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('cd13c644-737f-4d35-85f5-aef7f1f1768e', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('d2eeaf0f-5b2a-4870-822f-e55e15692493', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'ảnh chụp cửa võng

hoành phi, câu đối, cửa võng, thiều châu, y môn,…', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('d41cc389-6e6e-426b-8a3f-e7bb5d7c8b9e', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('d9be6f83-3a86-4c10-94ad-ff8f22275af2', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('dc96538a-4db6-4565-82f9-760d3f43045c', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('deedde9a-d4ac-41f3-8040-1f4502f13c4a', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'ảnh ngũ quả được điêu khắc ở vì kèo hiên

ngủ quả', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('df87cd2a-f9c6-48f9-adcc-5859bd058d53', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'ảnh ngựa được chmja khắc trên tường

voi, ngựa: Ở Đình Làng Chuông, các hình chạm voi và ngựa không chỉ là yếu tố trang trí mà còn góp phần tạo nên vẻ uy nghi của cổng đình.', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('e4b77892-1b97-452f-9192-eb07e21de7cc', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'hien_vat_co', 'Tượng Hậu Phật (trong chùa)', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('e555dfb3-0fde-433d-b566-71b3b2d5a5cd', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'doi_song_sinh_hoat', 'Mây', NULL, 'ảnh mây điêu khắc trên gỗ

mây', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('e759aa28-9938-4a2a-9f72-e6f5258c4221', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('f0feca49-f403-4458-a5f6-2a6d1401788c', '28dc7a86-a741-4fd7-9407-454b6af79bb4', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('f16da89e-309c-4267-a8e7-f6e0e8290975', 'e92783f4-ea38-4375-9555-6751b3ac9129', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('fc9f005f-2db3-4129-adc7-f2c6bfb6d0fc', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'ảnh rồng quấn mây

Không có', NULL, '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('067d90ad-4fb7-4b0b-a7a9-b8594f8324f6', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('07ec5b69-8c4d-4dd1-8c82-e6945203333e', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'có tre trúc , tùng', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('0f971134-f136-4635-bb10-4aa198998147', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('116b5022-197a-47bf-baab-488176f5f4e0', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('1428d990-d9c6-46d7-a77e-5ee37fbfef52', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'ảnh y môn

ảnh đỉnh đồng

ảnh chân nến

ảnh hạc chầu

từ lúc xây dựng nhà

có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('1968baa8-1e7c-4806-aa81-518e8f556382', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('1af4e49c-1970-4aa3-bfd8-bb97745f39c4', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('1c346b78-68a0-45a4-aca0-53a5e76e1f62', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('23d2187d-29ec-411d-a96d-ddb0ee54fd56', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('285658bf-bcb3-4a1d-a28a-c10c6d166bb5', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'ảnh ngai

ảnh đầy đủ đồ thờ tụng

có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('2f84e586-4bc3-4d1f-b71a-ee3fbdbaf2c3', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('3577938d-cc41-4cbf-b344-63c13c38d009', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Mây', NULL, 'https://drive.google.com/file/d/1eSSJfynlQtkjeCxoIO_H3_Q4CmlCXDZx/view?usp=sharing

có mây ở mặt trước bàn thờ', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('5253d96a-a9a1-4066-9e99-c744bc0ece14', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Tượng Hậu Phật (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('58260599-4fa5-4dcd-b6cc-44fc01437f4c', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'hoa văn cây cỏ trên mặt bình cổ đặt cạnh bàn thờ tổ', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('58bc1477-303e-4d51-a3f8-b85501547a79', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('5f8ebf40-de0c-4903-9e71-c49c84a8632a', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Tiên', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('61025efe-d79f-406e-bd1d-a2415664ec47', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('6aa18ef8-e574-46d6-b1b8-e0fd8120a434', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Tiên', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('71618b5a-f3b6-48ef-b3dc-4f2544967fec', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('723c07fe-561d-4126-b295-0372f5e71cce', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('72c75328-4e7b-42c1-b37e-223e411e2072', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('72d3c1ee-6381-45be-ad87-8bec972e5786', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('755605e5-7abb-40e1-b1c9-bed575b994da', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Khác', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('78f37674-dffa-4386-aad8-492643fe136e', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'phong_thuy_cat_tuong', 'Khác', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('7bdbadc0-154f-4fdb-a4da-0c071f16cf04', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('85e7699c-e9a6-42b0-8be0-67b1be8d02f7', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('8751d16c-9f1c-45ec-82e9-cfeffc1e4366', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('8802897f-d100-4b6d-893c-583553e5f959', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'hien_vat_co', 'Tượng Hậu Phật (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('88b5ec3a-1ec3-45c8-8b8d-c50bfed20a5c', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Mây', NULL, 'ảnh chi tiết mây quấn rồng

có mây ở mặt trước bàn thờ', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('964a44fb-e94c-4d42-bc94-69f7577a20a1', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('9ec6af5a-ebaa-4212-98bd-eaeb8b454b1c', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('a2681832-476c-42e9-b2d9-0f6285ebf80a', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('a433036e-0372-4308-95a4-ddc6544ea734', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'hien_vat_co', 'Tượng Hậu Phật (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('a60091ee-6881-4bfb-8704-300ad3403d06', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Mây', NULL, 'các vị thần tiên cưỡi mây', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('a68872fd-ac70-47a6-85d4-c85467338588', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('abf9e7a0-cb24-4518-8ee5-601823d7e86c', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Khác', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('ae12c31a-fca1-4a46-8b26-b9598c7df3ff', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('b00692f2-d744-49bc-91e1-114d79fe4443', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('b5983105-d757-4aae-85b7-ea9dd739fab5', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('b6ca402f-9450-49be-b25f-2e8e2482fcfc', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'phong_thuy_cat_tuong', 'Vật báu', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('ba4ef400-e8fd-4f2a-a8da-46c113731540', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'kkhông có

không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('bb40e228-d224-44fc-bafc-389b1d5ac477', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('bb41b261-19c8-4843-84e7-9d5e68606cbc', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('c1ead5ba-7b21-499f-a97f-3f9e971145cc', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('c2eaf001-5794-4df4-b227-814c2500138f', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'ảnh hoành phi

ảnh cửa võng

ảnh y môn

ảnh câu đối

từ lúc xây dựng nhà

có câu đối và hoành phi và các vật trang trí khác', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('c577b810-9816-4ec6-b686-5aacb49903b8', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('cae665ca-3c88-4952-9476-f360032beed8', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'tin_nguong_ton_giao', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'ảnh thờ tự có các linh vật

bức họa sau bàn thờ chính và mựt trước của bàn thờ', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('cfe82ca7-81b7-4e00-8d89-123674fd3157', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'https://drive.google.com/file/d/1MOE1u5R_TBm8fkfyf0Xm4-LutUL3eWJY/view?usp=sharing', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('d03c3996-63cb-4251-ac63-59d23d5aba9f', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('da881283-622a-4130-b719-ad4d689c1beb', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'phong_thuy_cat_tuong', 'Vật báu', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('df18dcdb-5f56-428b-9510-7e1468e66ba2', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'ảnh chụp chi tiét cổng chính ( cây mai)

ảnh hoa sen trên bàn thờ tự

ảnh hoa hồng ở sạp cúng bái

ảnh đầy đủ của bàn thờ có các chi tiết cây', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('df653264-351f-49df-8bf3-d069f3cbe567', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('dfa107f0-2747-4439-9294-ddebb081f65e', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('e3656917-8baa-4779-87b3-3032c78feccc', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('e6cf003f-8e0e-4b66-9151-e2b22e8d51a1', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'phong_thuy_cat_tuong', 'Vật báu', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('ee2eeb99-facd-4275-a3b8-cfecd7083fb4', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'có ở mặt trước bàn thờ', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('f005b73c-6597-4adc-8693-ee208fac8513', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('f046aff9-c385-44ee-8e8e-23a2f354e6cd', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('f06718ea-89ed-4325-bc13-1ed2541483dd', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('f24a989c-63d5-4d3c-b7e0-135064750def', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'hình tượng rộng cưỡi mây chầu nhật', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('f4872c30-f539-426f-ad9e-63aa436decee', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', 'tin_nguong_ton_giao', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'ảnh chi tiết bàn thờ tự có các linh vật

Mảng chạm có bố cục cân đối, đối xứng, nổi bật với hoa sen, chim muông, hoa lá và hình tượng rồng. Kỹ thuật chạm nổi nhiều lớp khá tinh xảo, tạo chiều sâu và vẻ bề thế. Tổng thể mang đậm giá trị mỹ thuật và ý nghĩa phong thủy, thờ tự truyền thống, thể hiện sự trang nghiêm, sung túc và phúc lộc.', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('f4fed6e7-b3bd-4f5c-9df7-c5b4ba440087', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'cây tre trúc ở đầu đao', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('fcf88438-320c-4e0d-853a-8db716837f71', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'không có', NULL, '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('4d5f257c-05b9-46ce-b9c0-549a9ccc940e', '7929cf67-5bc1-425f-b66e-1200ff174b80', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'https://drive.google.com/file/d/1TOoy9dOzqpqCgegESzq8kuK5fWojN5lD/view?usp=sharing

Không rõ thời điểm', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('73aa0396-7312-46ec-aacc-6dcd3c3fcac0', 'f5cc6df5-789e-4e33-a718-02219cf0c184', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'https://drive.google.com/file/d/1iiixBOetAX6S0PwcUPtVX29Es2q-HfZb/view?usp=sharing', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('79c561bb-5836-47d8-93c6-78b66e5c27f2', '7929cf67-5bc1-425f-b66e-1200ff174b80', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'https://drive.google.com/file/d/19Mu7L-_OokrP4FZ5uXih_kBopm4SMAxM/view?usp=sharing

Không rõ thời điểm

Kiệu thờ đặt tại gian chính, nguyên bản tuy nhiên không rõ niên đại', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('8a369ac0-fa49-4280-8041-8a90bde57eb8', '7929cf67-5bc1-425f-b66e-1200ff174b80', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'https://drive.google.com/file/d/1KFvX6PbmSBJwh3smivHNiDbPAN5C_ifH/view?usp=sharing

Lưỡng long chầu nguyệt trên đỉnh của Quán Phú Vinh', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('a47ac85e-9d9f-4c61-9384-b6377eb9965c', 'f5cc6df5-789e-4e33-a718-02219cf0c184', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'https://drive.google.com/file/d/1DpZcsTTOMh1wNeXVQHPlyF4qA0a5tYE1/view?usp=sharing

Không rõ niên đại

Mũ thờ 3 thành hoàng, hiện đang để trong nhà kho', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('b04f6782-3d82-40cb-9c31-289d10e5de16', 'f5cc6df5-789e-4e33-a718-02219cf0c184', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'https://drive.google.com/file/d/1rkqcTwv26fsTDcaWBj2iFnzDnLJtvIwC/view?usp=drive_link', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('b19aba5a-2eb8-4fce-8eb8-1d0b20680c03', '7929cf67-5bc1-425f-b66e-1200ff174b80', 'hien_vat_co', 'Đồ trang trí thờ tự gắn trên bộ khung kiến trúc (hoành phi, cuốn thư, câu đối, cửa võng, thiều châu, y môn,…)', NULL, 'https://drive.google.com/file/d/13P30onRzwpjKz5ZroiJDzhS_BL7PJ6EX/view?usp=sharing

Không rõ

Hoành phi trên đỉnh ban thờ', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('e6d50393-3c4d-4355-ad5e-5bca06e1a083', '7929cf67-5bc1-425f-b66e-1200ff174b80', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'https://drive.google.com/file/d/1CpOWrWlV_MdqQlq41K6Lzzo5fqJTXHfE/view?usp=sharing

Không rõ thời điểm

Ban thờ ở gian thờ chính', NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('02ccdc1c-1fa5-4d58-99b6-868e88dba5d1', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Mây', NULL, 'Mây: Họa tiết mây được thể hiện bằng các đường nét uyển chuyển, mềm mại, tượng trưng cho sự giao hòa giữa trời và đất, mang ý nghĩa cát tường, thanh cao và tạo vẻ đẹp linh thiêng cho kiến trúc truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('04abce26-a879-4f6f-b8d8-6c6c5cc7de0e', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Tiên', NULL, 'Tiên: Hình tượng tiên gắn với đời sống tín ngưỡng dân gian, biểu trưng cho sự thanh cao, an lành và ước vọng về cuộc sống hạnh phúc, tốt đẹp.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('0c2d8069-ece6-4bd5-91cd-ab8cd1120952', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'Trò chơi dân gian: Hoạt cảnh đánh cờ, đấu vật, đá cầu, chọi gà tái hiện sinh động đời sống văn hóa, vui chơi giải trí của người dân xưa. Hình tượng này phản ánh tinh thần gắn kết cộng đồng, đề cao sức khỏe, trí tuệ và nét đẹp truyền thống trong sinh hoạt dân gian Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('0c641747-889e-4133-9651-71866ce9c6bf', '44000000-0000-0000-0000-000000000004', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, '7

Hệ thống đồ tế khí được bố trí theo nguyên tắc đối xứng truyền thống. Chính giữa là bát hương và khám thờ sơn son thếp vàng, hai bên có hạc thờ, chân nến và bình hoa tạo nên không gian trang nghiêm. Nổi bật nhất là đôi hạc chầu hai bên án thờ, biểu tượng cho sự thanh khiết, trường tồn và ước vọng hướng tới cõi thiêng. Các đồ thờ chủ yếu mang phong cách truyền thống Bắc Bộ với chất liệu gỗ sơn son thếp vàng, đồng và gốm sứ.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('0e809246-f231-447f-bed7-52d2753c96ae', '44000000-0000-0000-0000-000000000004', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'Mả táng hàm rồng: Hình tượng kiến trúc mộ táng có tạo hình đầu hoặc hàm rồng bao bọc, thể hiện quan niệm phong thủy về sự che chở, bảo hộ linh hồn người đã khuất. Đề tài mang ý nghĩa cát tường, cầu mong sự trường tồn, bình an và phúc đức cho con cháu đời sau.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('1112f8e6-b0d9-48a1-966e-1ec7b2123e33', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'Hoa quả: Hình tượng mẫu đơn, hoa hồng, hoa cúc, hoa đào, quả lựu được thể hiện với đường nét mềm mại, giàu tính trang trí, tượng trưng cho phú quý, trường thọ, hạnh phúc, may mắn và sự sinh sôi, sung túc trong đời sống văn hóa truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('1382d213-9607-47ec-a168-7e6d479f1376', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Tiên', NULL, 'Tiên: Hình tượng tiên gắn với đời sống tín ngưỡng dân gian, biểu trưng cho sự thanh cao, an lành và ước vọng về cuộc sống hạnh phúc, tốt đẹp.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('183c9439-0509-4a4a-a7a4-4feffffc47cd', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'Cây cối: Hình tượng tre, trúc, tùng được sử dụng phổ biến trong trang trí kiến trúc truyền thống, biểu trưng cho sự bền bỉ, ngay thẳng, thanh cao và sức sống trường tồn. Đề tài này thể hiện quan niệm sống hài hòa với thiên nhiên và những phẩm chất tốt đẹp mà con người hướng tới.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('1c7b5837-d4df-4946-ab4d-e8871823fa49', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'Hoa quả: Hình tượng mẫu đơn, hoa hồng, hoa cúc, hoa đào, quả lựu được thể hiện với đường nét mềm mại, giàu tính trang trí, tượng trưng cho phú quý, trường thọ, hạnh phúc, may mắn và sự sinh sôi, sung túc trong đời sống văn hóa truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('1eebe63f-2dd8-4f71-8611-d1d9b632f75c', '44000000-0000-0000-0000-000000000001', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'Biểu tượng thiêng: không gian chùa giếng
 Biểu tượng Tôn giáo: các tượng thờ Phật giáo', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('2290ac72-52b5-4a79-939a-f0be55e22330', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Vật báu', NULL, 'Vật báu: Hình tượng các vật báu trong tín ngưỡng và mỹ thuật truyền thống, tượng trưng cho tài lộc, phúc lành, sự cao quý và thịnh vượng. Đề tài mang ý nghĩa cát tường, cầu mong cuộc sống ấm no, hạnh phúc và may mắn.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('2480dd0d-751e-461f-b1b8-b576cc95c08f', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Vật báu', NULL, 'Vật báu: Hình tượng các vật báu trong tín ngưỡng và mỹ thuật truyền thống, tượng trưng cho tài lộc, phúc lành, sự cao quý và thịnh vượng. Đề tài mang ý nghĩa cát tường, cầu mong cuộc sống ấm no, hạnh phúc và may mắn.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('296a9c11-70b8-404f-bb6e-a6486b3c1ec2', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'Trò chơi dân gian: Hoạt cảnh đánh cờ, đấu vật, đá cầu, chọi gà tái hiện sinh động đời sống văn hóa, vui chơi giải trí của người dân xưa. Hình tượng này phản ánh tinh thần gắn kết cộng đồng, đề cao sức khỏe, trí tuệ và nét đẹp truyền thống trong sinh hoạt dân gian Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('33a75d1f-0f3e-4ff3-aab3-cd95cabd7e63', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'Tích xưa: Các hình tượng, hoạt cảnh tái hiện những câu chuyện và điển tích dân gian, lịch sử hoặc tôn giáo quen thuộc, góp phần truyền tải bài học đạo đức, triết lý nhân sinh và các giá trị văn hóa truyền thống của dân tộc.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('3606daf2-d896-4053-bd68-4782d5ff868e', '44000000-0000-0000-0000-000000000003', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'Tượng Phật giáo (trong chùa) thường được đặt tại chính điện hoặc các ban thờ, với dáng ngồi thiền, đứng hoặc nằm trang nghiêm. Tượng có khuôn mặt từ bi, thanh tịnh, biểu tượng cho trí tuệ, lòng nhân ái và sự giác ngộ theo giáo lý Phật giáo.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('37f0d912-dcc9-497e-a0e0-e0de134b7c5c', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'Động vật: Hình tượng voi, hổ, ngựa, lợn, gà, chó, mèo... được thể hiện gần gũi, sinh động, phản ánh đời sống lao động, sản xuất và sinh hoạt thường ngày của người dân. Các hình tượng này vừa mang giá trị trang trí, vừa gửi gắm những ước vọng về sức mạnh, sự sung túc, may mắn và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('3a5bed33-98dd-4aa1-8854-fea212ac95b7', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Tiên', NULL, 'Tiên: Hình tượng tiên gắn với đời sống tín ngưỡng dân gian, biểu trưng cho sự thanh cao, an lành và ước vọng về cuộc sống hạnh phúc, tốt đẹp.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('3abda186-8632-4a32-96c6-8933537ee59c', '44000000-0000-0000-0000-000000000003', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'Biểu tượng thiêng: không gian chùa giếng
 Biểu tượng Tôn giáo: các tượng thờ Phật giáo', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('3d43be04-62da-4c8c-8ba8-eed1fe0458dd', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'Long (Rồng): Linh vật biểu tượng cho quyền uy, sức mạnh và thịnh vượng. Tạo hình thân dài uốn lượn mềm mại, được chạm nổi hoặc chạm lộng tinh xảo với các chi tiết vảy, râu, bờm đặc sắc, thể hiện giá trị nghệ thuật và văn hóa truyền thống Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('4233575b-103e-42d0-9a91-0426047dc035', '44000000-0000-0000-0000-000000000004', 'hien_vat_co', 'Tượng phật giáo (trong chùa)', NULL, 'Tượng Phật giáo (trong chùa) thường được đặt tại chính điện hoặc các ban thờ, với dáng ngồi thiền, đứng hoặc nằm trang nghiêm. Tượng có khuôn mặt từ bi, thanh tịnh, biểu tượng cho trí tuệ, lòng nhân ái và sự giác ngộ theo giáo lý Phật giáo.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('42946ea3-cb50-45f7-bf68-1d6b07043142', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'Lễ hội, rước: Hoạt cảnh con người tham gia lễ hội, rước kiệu trong không khí trang nghiêm và nhộn nhịp, phản ánh đời sống văn hóa cộng đồng, tín ngưỡng và truyền thống dân gian.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('43c94546-69a7-4017-a9aa-70dfecba7b67', '44000000-0000-0000-0000-000000000003', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, '7

Hệ thống đồ tế khí được bố trí theo nguyên tắc đối xứng truyền thống. Chính giữa là bát hương và khám thờ sơn son thếp vàng, hai bên có hạc thờ, chân nến và bình hoa tạo nên không gian trang nghiêm. Nổi bật nhất là đôi hạc chầu hai bên án thờ, biểu tượng cho sự thanh khiết, trường tồn và ước vọng hướng tới cõi thiêng. Các đồ thờ chủ yếu mang phong cách truyền thống Bắc Bộ với chất liệu gỗ sơn son thếp vàng, đồng và gốm sứ.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('46991fe5-1059-4f84-b05f-f93ad1907c5b', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, 'Hệ thống đồ tế khí được bố trí theo nguyên tắc đối xứng truyền thống. Chính giữa là bát hương và khám thờ sơn son thếp vàng, hai bên có hạc thờ, chân nến và bình hoa tạo nên không gian trang nghiêm. Nổi bật nhất là đôi hạc chầu hai bên án thờ, biểu tượng cho sự thanh khiết, trường tồn và ước vọng hướng tới cõi thiêng. Các đồ thờ chủ yếu mang phong cách truyền thống Bắc Bộ với chất liệu gỗ sơn son thếp vàng, đồng và gốm sứ.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('4832b38b-1aa0-450b-bdb2-e69895ffeaba', '44000000-0000-0000-0000-000000000004', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'Long quấn thủy: Hình tượng rồng uốn lượn trong sóng nước, biểu trưng cho sự hòa hợp giữa trời và đất, sức mạnh, tài lộc và nguồn sinh khí dồi dào. Đề tài mang ý nghĩa cát tường, cầu mong mưa thuận gió hòa, cuộc sống thịnh vượng và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('4b4c1ca4-da06-447e-a695-e4d1ce33c6f2', '44000000-0000-0000-0000-000000000002', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'Mả táng hàm rồng: Hình tượng kiến trúc mộ táng có tạo hình đầu hoặc hàm rồng bao bọc, thể hiện quan niệm phong thủy về sự che chở, bảo hộ linh hồn người đã khuất. Đề tài mang ý nghĩa cát tường, cầu mong sự trường tồn, bình an và phúc đức cho con cháu đời sau.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('4e6e8a4a-03e2-473e-a26b-b81c5a18f5fd', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'Tích xưa: Các hình tượng, hoạt cảnh tái hiện những câu chuyện và điển tích dân gian, lịch sử hoặc tôn giáo quen thuộc, góp phần truyền tải bài học đạo đức, triết lý nhân sinh và các giá trị văn hóa truyền thống của dân tộc.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('53937ea3-c850-499d-b605-26ca082ad427', '44000000-0000-0000-0000-000000000001', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'Long quấn thủy: Hình tượng rồng uốn lượn trong sóng nước, biểu trưng cho sự hòa hợp giữa trời và đất, sức mạnh, tài lộc và nguồn sinh khí dồi dào. Đề tài mang ý nghĩa cát tường, cầu mong mưa thuận gió hòa, cuộc sống thịnh vượng và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('54ec8a04-09c8-4ce7-b9ce-01e35af00d03', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'Cây cối: Hình tượng tre, trúc, tùng được sử dụng phổ biến trong trang trí kiến trúc truyền thống, biểu trưng cho sự bền bỉ, ngay thẳng, thanh cao và sức sống trường tồn. Đề tài này thể hiện quan niệm sống hài hòa với thiên nhiên và những phẩm chất tốt đẹp mà con người hướng tới.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('5d975d3a-b23b-4870-be82-cd94024a2345', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'Long (Rồng): Linh vật biểu tượng cho quyền uy, sức mạnh và thịnh vượng. Tạo hình thân dài uốn lượn mềm mại, được chạm nổi hoặc chạm lộng tinh xảo với các chi tiết vảy, râu, bờm đặc sắc, thể hiện giá trị nghệ thuật và văn hóa truyền thống Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('5e0d8c57-43c6-4c21-a2e9-1ee1413440dd', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Vật báu', NULL, 'Vật báu: Hình tượng các vật báu trong tín ngưỡng và mỹ thuật truyền thống, tượng trưng cho tài lộc, phúc lành, sự cao quý và thịnh vượng. Đề tài mang ý nghĩa cát tường, cầu mong cuộc sống ấm no, hạnh phúc và may mắn.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('5eab490d-0941-4031-a420-068da11a04da', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Tiên', NULL, 'Tiên: Hình tượng tiên gắn với đời sống tín ngưỡng dân gian, biểu trưng cho sự thanh cao, an lành và ước vọng về cuộc sống hạnh phúc, tốt đẹp.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('5ebdc6e7-5a0c-4c56-8b45-62b405fdc07f', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'Niên đại ước đoán: cuối thế kỷ XIX - đầu thế kỷ XX.

Hương án được đặt ở vị trí trung tâm phía trước ban thờ, dạng hình chữ nhật, mặt án rộng để bày lễ vật và đồ thờ. Phía sau là khám thờ bằng gỗ sơn son thếp vàng, trang trí hoa văn chạm khắc công phu. Bên trong khám đặt ngai thờ và bài vị, thể hiện sự tôn nghiêm của đối tượng được thờ phụng. Tổng thể đồ tự khí có màu son thếp vàng nổi bật, được bố trí cân đối, tạo nên không gian thờ tự trang nghiêm và linh thiêng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('5ecaa944-c833-4061-b8f6-790b5c63c5aa', '44000000-0000-0000-0000-000000000003', 'tin_nguong_ton_giao', 'Các hình tượng linh hóa: Cá hóa rồng, cây cỏ hóa rồng,…', NULL, 'Hình tượng cá hóa rồng trên mái  được thể hiện bằng các linh vật uốn lượn dọc bờ nóc, kết hợp đặc điểm của cá chép và rồng. Biểu tượng này thể hiện ý chí vượt khó, sự thăng hoa và khát vọng đạt tới cảnh giới cao đẹp trong tín ngưỡng dân gian và Phật giáo Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('63061bab-ad50-4a37-ab55-e67e46cf7f29', '44000000-0000-0000-0000-000000000002', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'Biểu tượng thiêng: không gian chùa giếng
 Biểu tượng Tôn giáo: các tượng thờ Phật giáo', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('78e8233e-d36f-42a8-8b48-eed9aae5470c', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'Phồn thực: Hình tượng biểu trưng cho sự sinh sôi, nảy nở và ước vọng về cuộc sống no đủ, con cháu đông đúc. Đây là đề tài phổ biến trong tín ngưỡng dân gian, thể hiện khát vọng về sự phát triển và thịnh vượng của cộng đồng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('7a1bb904-811f-49a4-9973-8d37b64e27a1', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'Động vật: Hình tượng voi, hổ, ngựa, lợn, gà, chó, mèo... được thể hiện gần gũi, sinh động, phản ánh đời sống lao động, sản xuất và sinh hoạt thường ngày của người dân. Các hình tượng này vừa mang giá trị trang trí, vừa gửi gắm những ước vọng về sức mạnh, sự sung túc, may mắn và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('7ceb47d1-eb32-4d3b-95c6-5020b3b49612', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'Trò chơi dân gian: Hoạt cảnh đánh cờ, đấu vật, đá cầu, chọi gà tái hiện sinh động đời sống văn hóa, vui chơi giải trí của người dân xưa. Hình tượng này phản ánh tinh thần gắn kết cộng đồng, đề cao sức khỏe, trí tuệ và nét đẹp truyền thống trong sinh hoạt dân gian Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('7e997816-8c49-4860-a7cc-3e332b07ae56', '44000000-0000-0000-0000-000000000004', 'hien_vat_co', 'Tượng Mẫu (trong đền, phủ)', NULL, 'Tượng Mẫu (trong đền, phủ) thường thờ các vị Thánh Mẫu trong tín ngưỡng thờ Mẫu của người Việt. Tượng được thể hiện với vẻ đẹp uy nghiêm, phúc hậu, trang phục lộng lẫy, tượng trưng cho quyền năng, lòng nhân từ và sự che chở đối với con người.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('82d8dd2d-c17f-48f7-a409-eefe2b228b18', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'https://drive.google.com/file/d/1f5pPXxCSydI0vtlwdJnisHno_FvwP8eD/view?usp=drive_link

Tích xưa: Các hình tượng, hoạt cảnh tái hiện những câu chuyện và điển tích dân gian, lịch sử hoặc tôn giáo quen thuộc, góp phần truyền tải bài học đạo đức, triết lý nhân sinh và các giá trị văn hóa truyền thống của dân tộc.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('837b7717-ffa5-46b9-8f57-89e47d88eaae', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Trò chơi dân gian: Đánh cờ, đấu vật, đá cầu, chọi gà', NULL, 'Trò chơi dân gian: Hoạt cảnh đánh cờ, đấu vật, đá cầu, chọi gà tái hiện sinh động đời sống văn hóa, vui chơi giải trí của người dân xưa. Hình tượng này phản ánh tinh thần gắn kết cộng đồng, đề cao sức khỏe, trí tuệ và nét đẹp truyền thống trong sinh hoạt dân gian Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('8a41295d-3c64-424c-86d5-70b4fb71470d', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Mây', NULL, 'https://drive.google.com/file/d/14eckJm0Mgt1B47uIZvmG9yIDdBhTZmVK/view?usp=drive_link

Mây: Họa tiết mây được thể hiện bằng các đường nét uyển chuyển, mềm mại, tượng trưng cho sự giao hòa giữa trời và đất, mang ý nghĩa cát tường, thanh cao và tạo vẻ đẹp linh thiêng cho kiến trúc truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('8ae20d17-ab04-4fc4-bd72-c163a7cdd7aa', '44000000-0000-0000-0000-000000000004', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'Hương án được đặt ở vị trí trung tâm phía trước ban thờ, dạng hình chữ nhật, mặt án rộng để bày lễ vật và đồ thờ. Phía sau là khám thờ bằng gỗ sơn son thếp vàng, trang trí hoa văn chạm khắc công phu. Bên trong khám đặt ngai thờ và bài vị, thể hiện sự tôn nghiêm của đối tượng được thờ phụng. Tổng thể đồ tự khí có màu son thếp vàng nổi bật, được bố trí cân đối, tạo nên không gian thờ tự trang nghiêm và linh thiêng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('967a68af-bb59-462c-bb86-577856923a2f', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'Lễ hội, rước: Hoạt cảnh con người tham gia lễ hội, rước kiệu trong không khí trang nghiêm và nhộn nhịp, phản ánh đời sống văn hóa cộng đồng, tín ngưỡng và truyền thống dân gian.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('96df3544-5876-4a1f-a87d-9726ae7f12ed', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'Phồn thực: Hình tượng biểu trưng cho sự sinh sôi, nảy nở và ước vọng về cuộc sống no đủ, con cháu đông đúc. Đây là đề tài phổ biến trong tín ngưỡng dân gian, thể hiện khát vọng về sự phát triển và thịnh vượng của cộng đồng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('a7052e4a-2405-4109-9a16-47d64406e478', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'Hoa quả: Hình tượng mẫu đơn, hoa hồng, hoa cúc, hoa đào, quả lựu được thể hiện với đường nét mềm mại, giàu tính trang trí, tượng trưng cho phú quý, trường thọ, hạnh phúc, may mắn và sự sinh sôi, sung túc trong đời sống văn hóa truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('a82cdcba-8bda-4eb1-8c77-d9d96c251a3c', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'Lễ hội, rước: Hoạt cảnh con người tham gia lễ hội, rước kiệu trong không khí trang nghiêm và nhộn nhịp, phản ánh đời sống văn hóa cộng đồng, tín ngưỡng và truyền thống dân gian.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('a8c578dd-f0ef-4b3a-a5cb-6a129a90cbd9', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'Cây cối: Hình tượng tre, trúc, tùng được sử dụng phổ biến trong trang trí kiến trúc truyền thống, biểu trưng cho sự bền bỉ, ngay thẳng, thanh cao và sức sống trường tồn. Đề tài này thể hiện quan niệm sống hài hòa với thiên nhiên và những phẩm chất tốt đẹp mà con người hướng tới.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('af931ecf-a8aa-4f21-96af-1d1998091c1d', '44000000-0000-0000-0000-000000000003', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'Long quấn thủy: Hình tượng rồng uốn lượn trong sóng nước, biểu trưng cho sự hòa hợp giữa trời và đất, sức mạnh, tài lộc và nguồn sinh khí dồi dào. Đề tài mang ý nghĩa cát tường, cầu mong mưa thuận gió hòa, cuộc sống thịnh vượng và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('b3269867-8313-4102-b78c-af309cf26bcd', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Đề tài hoa quả: Mẫu đơn, hồng, cúc, đào, lựu', NULL, 'Hoa quả: Hình tượng mẫu đơn, hoa hồng, hoa cúc, hoa đào, quả lựu được thể hiện với đường nét mềm mại, giàu tính trang trí, tượng trưng cho phú quý, trường thọ, hạnh phúc, may mắn và sự sinh sôi, sung túc trong đời sống văn hóa truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('bb21510b-5816-4357-b985-3032c6bcab33', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'Long (Rồng): Linh vật biểu tượng cho quyền uy, sức mạnh và thịnh vượng. Tạo hình thân dài uốn lượn mềm mại, được chạm nổi hoặc chạm lộng tinh xảo với các chi tiết vảy, râu, bờm đặc sắc, thể hiện giá trị nghệ thuật và văn hóa truyền thống Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('bc10c0f6-2a8f-4176-a47b-1f229fb75f65', '44000000-0000-0000-0000-000000000001', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'Mả táng hàm rồng: Hình tượng kiến trúc mộ táng có tạo hình đầu hoặc hàm rồng bao bọc, thể hiện quan niệm phong thủy về sự che chở, bảo hộ linh hồn người đã khuất. Đề tài mang ý nghĩa cát tường, cầu mong sự trường tồn, bình an và phúc đức cho con cháu đời sau.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('bfa8bac9-b058-4e87-9bfb-8247a516580a', '44000000-0000-0000-0000-000000000004', 'hien_vat_co', 'Tượng Tổ (trong chùa)', NULL, 'Tượng Tổ (trong chùa) thường thờ các vị Tổ sư có công sáng lập hoặc truyền bá Phật giáo. Tượng thường được thể hiện trong tư thế ngồi, khuôn mặt đôn hậu, trang nghiêm, khoác áo cà sa, biểu tượng cho trí tuệ, đạo hạnh và sự kế thừa dòng truyền thừa Phật pháp.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('c243fc18-be12-4464-ab3b-631d92518244', '44000000-0000-0000-0000-000000000004', 'phong_thuy_cat_tuong', 'Vật báu', NULL, 'Vật báu: Hình tượng các vật báu trong tín ngưỡng và mỹ thuật truyền thống, tượng trưng cho tài lộc, phúc lành, sự cao quý và thịnh vượng. Đề tài mang ý nghĩa cát tường, cầu mong cuộc sống ấm no, hạnh phúc và may mắn.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('c4cedae8-f295-4611-ad23-c89826bba47d', '44000000-0000-0000-0000-000000000003', 'doi_song_sinh_hoat', 'Tích xưa', NULL, 'Tích xưa: Các hình tượng, hoạt cảnh tái hiện những câu chuyện và điển tích dân gian, lịch sử hoặc tôn giáo quen thuộc, góp phần truyền tải bài học đạo đức, triết lý nhân sinh và các giá trị văn hóa truyền thống của dân tộc.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('cbc422fe-44c6-4e9d-8b2d-646861be492b', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'Phồn thực: Hình tượng biểu trưng cho sự sinh sôi, nảy nở và ước vọng về cuộc sống no đủ, con cháu đông đúc. Đây là đề tài phổ biến trong tín ngưỡng dân gian, thể hiện khát vọng về sự phát triển và thịnh vượng của cộng đồng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('cc28086d-b9d6-4265-8a78-6777f635b551', '44000000-0000-0000-0000-000000000003', 'phong_thuy_cat_tuong', 'Mả táng hàm rồng', NULL, 'Mả táng hàm rồng: Hình tượng kiến trúc mộ táng có tạo hình đầu hoặc hàm rồng bao bọc, thể hiện quan niệm phong thủy về sự che chở, bảo hộ linh hồn người đã khuất. Đề tài mang ý nghĩa cát tường, cầu mong sự trường tồn, bình an và phúc đức cho con cháu đời sau.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('d1291261-c50b-4761-8601-bef361446d63', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Hoạt cảnh con người: Lễ hội, rước', NULL, 'Lễ hội, rước: Hoạt cảnh con người tham gia lễ hội, rước kiệu trong không khí trang nghiêm và nhộn nhịp, phản ánh đời sống văn hóa cộng đồng, tín ngưỡng và truyền thống dân gian.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('d2fd0372-4df2-4312-be02-a0b6ef3828c1', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Phồn thực', NULL, 'Phồn thực: Hình tượng biểu trưng cho sự sinh sôi, nảy nở và ước vọng về cuộc sống no đủ, con cháu đông đúc. Đây là đề tài phổ biến trong tín ngưỡng dân gian, thể hiện khát vọng về sự phát triển và thịnh vượng của cộng đồng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('d3f3c318-d0c5-4959-ae80-c77792b86941', '44000000-0000-0000-0000-000000000004', 'hien_vat_co', 'Tượng Hậu Phật (trong chùa)', NULL, 'Tượng Hậu Phật được đặt phía sau ban thờ chính trong chùa, thường có dáng ngồi thiền trên tòa sen, khuôn mặt hiền từ và trang nghiêm. Tượng tượng trưng cho lòng từ bi, trí tuệ và sự giác ngộ của Đức Phật.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('dc1f0a7e-19ca-4dff-82cf-5aa22fe101d5', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'Niên đại ước đoán: cuối thế kỷ XIX - đầu thế kỷ XX.

Hương án được đặt ở vị trí trung tâm phía trước ban thờ, dạng hình chữ nhật, mặt án rộng để bày lễ vật và đồ thờ. Phía sau là khám thờ bằng gỗ sơn son thếp vàng, trang trí hoa văn chạm khắc công phu. Bên trong khám đặt ngai thờ và bài vị, thể hiện sự tôn nghiêm của đối tượng được thờ phụng. Tổng thể đồ tự khí có màu son thếp vàng nổi bật, được bố trí cân đối, tạo nên không gian thờ tự trang nghiêm và linh thiêng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('ddf191a6-5054-4346-bc9f-3f7d9df95d25', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Đề tài cây cối: tre, trúc, tùng', NULL, 'https://drive.google.com/file/d/1DrAchVmGf-OL98vods5Y8cmuD6k3L4Qg/view?usp=sharing

Cây cối: Hình tượng tre, trúc, tùng được sử dụng phổ biến trong trang trí kiến trúc truyền thống, biểu trưng cho sự bền bỉ, ngay thẳng, thanh cao và sức sống trường tồn. Đề tài này thể hiện quan niệm sống hài hòa với thiên nhiên và những phẩm chất tốt đẹp mà con người hướng tới.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('e9a30b3d-575d-46f2-a134-d44d7fcde044', '44000000-0000-0000-0000-000000000004', 'hien_vat_co', 'Tượng thánh, thần (trong đền, miếu, Đạo quán, Hội quán', NULL, 'Tượng thánh, thần trong đền, miếu, đạo quán, hội quán thường được đặt ở vị trí trung tâm thờ tự, thể hiện các vị thần linh hoặc nhân vật được tôn kính. Tượng có dáng vẻ uy nghiêm, trang phục cầu kỳ, nét mặt trang trọng, biểu tượng cho quyền năng, sự che chở và niềm tin tâm linh của cộng đồng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('ec1dbb59-18c1-4055-b7a8-576794f369ca', '44000000-0000-0000-0000-000000000003', 'hien_vat_co', 'Đồ tự khí: hương án, khám, ngai, bài vị', NULL, 'Niên đại ước đoán: cuối thế kỷ XIX - đầu thế kỷ XX.

Hương án được đặt ở vị trí trung tâm phía trước ban thờ, dạng hình chữ nhật, mặt án rộng để bày lễ vật và đồ thờ. Phía sau là khám thờ bằng gỗ sơn son thếp vàng, trang trí hoa văn chạm khắc công phu. Bên trong khám đặt ngai thờ và bài vị, thể hiện sự tôn nghiêm của đối tượng được thờ phụng. Tổng thể đồ tự khí có màu son thếp vàng nổi bật, được bố trí cân đối, tạo nên không gian thờ tự trang nghiêm và linh thiêng.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.876Z'),
  ('eee8b1b0-96d1-4694-af86-698e20d7a2d7', '44000000-0000-0000-0000-000000000004', 'tin_nguong_ton_giao', 'Biểu tượng thiêng và Biểu tượng tôn giáo', NULL, 'Biểu tượng thiêng: không gian chùa giếng
 Biểu tượng Tôn giáo: các tượng thờ Phật giáo', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('ef52648a-b1e6-4162-ac48-594ed38483a1', '44000000-0000-0000-0000-000000000001', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'Động vật: Hình tượng voi, hổ, ngựa, lợn, gà, chó, mèo... được thể hiện gần gũi, sinh động, phản ánh đời sống lao động, sản xuất và sinh hoạt thường ngày của người dân. Các hình tượng này vừa mang giá trị trang trí, vừa gửi gắm những ước vọng về sức mạnh, sự sung túc, may mắn và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('f1debfe3-9e3d-485d-9433-70f7fc47effb', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Mây', NULL, 'Mây: Họa tiết mây được thể hiện bằng các đường nét uyển chuyển, mềm mại, tượng trưng cho sự giao hòa giữa trời và đất, mang ý nghĩa cát tường, thanh cao và tạo vẻ đẹp linh thiêng cho kiến trúc truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('f2a3a854-7e7a-421a-ac12-cdaf54bbf1c1', '44000000-0000-0000-0000-000000000002', 'doi_song_sinh_hoat', 'Mây', NULL, 'Mây: Họa tiết mây được thể hiện bằng các đường nét uyển chuyển, mềm mại, tượng trưng cho sự giao hòa giữa trời và đất, mang ý nghĩa cát tường, thanh cao và tạo vẻ đẹp linh thiêng cho kiến trúc truyền thống.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('f41420f4-3a10-49b7-89ee-5f4393d0d686', '44000000-0000-0000-0000-000000000002', 'phong_thuy_cat_tuong', 'Long quấn thủy', NULL, 'Long quấn thủy: Hình tượng rồng uốn lượn trong sóng nước, biểu trưng cho sự hòa hợp giữa trời và đất, sức mạnh, tài lộc và nguồn sinh khí dồi dào. Đề tài mang ý nghĩa cát tường, cầu mong mưa thuận gió hòa, cuộc sống thịnh vượng và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('f7d979d7-458a-4529-90d2-209b63805be0', '44000000-0000-0000-0000-000000000001', 'tin_nguong_ton_giao', 'Linh vật: Rồng, Phượng, Lân, Long mã, nghê, rùa,…', NULL, 'https://drive.google.com/file/d/1f48fnNzd2nmIK2qwN5aTuKbmpA1IODiL/view?usp=drive_link

Hình tượng cá hóa rồng trên mái Chùa Sổ được thể hiện bằng các linh vật uốn lượn dọc bờ nóc, kết hợp đặc điểm của cá chép và rồng. Biểu tượng này thể hiện ý chí vượt khó, sự thăng hoa và khát vọng đạt tới cảnh giới cao đẹp trong tín ngưỡng dân gian và Phật giáo Việt Nam.

Long (Rồng): Linh vật biểu tượng cho quyền uy, sức mạnh và thịnh vượng. Tạo hình thân dài uốn lượn mềm mại, được chạm nổi hoặc chạm lộng tinh xảo với các chi tiết vảy, râu, bờm đặc sắc, thể hiện giá trị nghệ thuật và văn hóa truyền thống Việt Nam.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('fb3c20ec-c748-4df1-b043-58ef4d82eb1a', '44000000-0000-0000-0000-000000000001', 'hien_vat_co', 'Đồ tế khí: Bát hương, đỉnh, mâm bồng, đài, đồ chấp kích, lỗ bộ, lạc chầu, phỗng chầu,…', NULL, '7

Hệ thống đồ tế khí được bố trí theo nguyên tắc đối xứng truyền thống. Chính giữa là bát hương và khám thờ sơn son thếp vàng, hai bên có hạc thờ, chân nến và bình hoa tạo nên không gian trang nghiêm. Nổi bật nhất là đôi hạc chầu hai bên án thờ, biểu tượng cho sự thanh khiết, trường tồn và ước vọng hướng tới cõi thiêng. Các đồ thờ chủ yếu mang phong cách truyền thống Bắc Bộ với chất liệu gỗ sơn son thếp vàng, đồng và gốm sứ.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z'),
  ('ffdc13bc-6596-401b-aa46-b9e777b5e126', '44000000-0000-0000-0000-000000000004', 'doi_song_sinh_hoat', 'Đề tài động vật: Voi, hổ, ngựa,, lợn, gà, chó mèo,…', NULL, 'Động vật: Hình tượng voi, hổ, ngựa, lợn, gà, chó, mèo... được thể hiện gần gũi, sinh động, phản ánh đời sống lao động, sản xuất và sinh hoạt thường ngày của người dân. Các hình tượng này vừa mang giá trị trang trí, vừa gửi gắm những ước vọng về sức mạnh, sự sung túc, may mắn và bình an.', NULL, '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z')
ON CONFLICT (id) DO UPDATE SET
  "building_id" = EXCLUDED."building_id",
  "theme_group" = EXCLUDED."theme_group",
  "subject_name" = EXCLUDED."subject_name",
  "era_estimate" = EXCLUDED."era_estimate",
  "description" = EXCLUDED."description",
  "media_ids" = EXCLUDED."media_ids",
  "created_at" = EXCLUDED."created_at",
  "updated_at" = EXCLUDED."updated_at";
