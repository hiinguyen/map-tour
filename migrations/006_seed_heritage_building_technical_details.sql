-- 21 hồ sơ đo đạc kỹ thuật (1-1 với heritage_buildings). Cột bản vẽ mặt bằng/
-- mặt cắt (floor_plan_drawing_media_id/section_drawing_media_id) gán ở bước
-- cuối (012_link_media.sql), sau khi bảng media đã có dữ liệu.
-- Idempotent: UPSERT theo id cố định.

INSERT INTO "heritage_building_technical_details" ("id", "building_id", "roof_layers", "roof_shape", "roof_material", "roof_color", "facade_material", "facade_condition", "floor_material", "floor_pattern", "structure_material", "structure_condition", "column_height_cm", "column_diameter_cm", "pedestal_material", "pedestal_size", "pedestal_type", "created_at", "updated_at")
VALUES
  ('45000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '2 tầng mái', '2 mái', 'ngói vảy rồng', 'màu đỏ gạch nung', 'gỗ', 'nguyên bản', 'lát gạch chỉ đỏ', 'lát theo kiểu xương cá', 'gỗ', 'nguyên bản', NULL, NULL, 'đá xanh', NULL, 'tảng bồng', '2026-09-21T02:54:19.503Z', '2026-09-21T07:18:35.222Z'),
  ('45000000-0000-0000-0000-000000000002', '44000000-0000-0000-0000-000000000002', '1 tầng mái', '4 mái bít đốc', 'ngói vảy rồng', 'màu đỏ gạch đất nung', 'Gạch đá', NULL, 'gạch lát', 'lát vuông', 'hỗn hợp', NULL, NULL, NULL, 'Vật liệu đá', NULL, 'tảng bẹt', '2026-09-21T02:54:19.503Z', '2026-09-21T07:18:35.222Z'),
  ('45000000-0000-0000-0000-000000000004', '44000000-0000-0000-0000-000000000004', '1 tầng mái', '2 mái', 'ngói đất nung truyền thống', 'mái màu đỏ', 'trát vữa', 'nguyên bản', 'gạch đất nung', 'lát mạch thẳng', 'khung gỗ', 'nguyên bản', NULL, NULL, 'đá xanh', '400 x 400mm', 'tảng bẹt', '2026-09-21T02:54:19.503Z', '2026-09-21T07:18:35.222Z'),
  ('356b0aa5-aba0-4a9b-bb71-0e544bfaf3ce', '414cdd05-ffeb-4ea2-b5f4-3c4caa9b0c02', '1tầng mái', '2mái', 'mái vảy rồng', 'màu đỏ đất nung', 'hỗn hợp', 'nguyên bản', 'gạch chỉ', 'lát vuông', 'hỗn hợp', 'nguyên bản', NULL, NULL, 'Vật liệu đá xanh', NULL, 'Tảng bồng', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('81aff0df-93c5-4f80-a637-8a490f296358', 'bf94d200-fd5c-46ea-a1fb-2cb52eb4797c', '1 tầng mái', 'hai mái', 'mái vảy rồng', 'màu đỏ gạch đất nung', 'gạch', 'nguyên bản', 'Nhà chính: lát gạch chỉ trong nhà và lát đá xanh ngoài hiên 
Nhà phụ: lát gạch hiện đại trong nhà 
Ngoài sân lát đá ong', 'Trong nhà lát vuông
Ngoài hiên lát xương cá 
Ngoài sân lát vuông', 'hỗn hợp', 'nguyên bản', NULL, NULL, 'đá xanh', '300 x 300 mm', 'Nhà chính: chân tảng tảng bồng ngoài cột hiên, tảng bẹt với cột nhà 
Nhà phụ: chân tảng bồng', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('9ed98927-6a42-4c2f-8cd4-903bf009dc37', '3ee3bd85-6227-4c96-ba05-ff8b2b74034d', '1 tầng mái', '2 mái', 'mái ngói không rõ chất liệu', 'Không rõ màu sắc', 'gạch', 'Nguyên bản', 'gạch chỉ', 'lát vuông', 'gạch', 'Nguyên bản', NULL, NULL, 'bê tông', 'trụ tảng 40*40', 'Trụ tảng', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('d1050fd3-522a-4dc3-8e7e-2f39afad2644', '98dbb779-b90c-469b-bc18-8179a8158231', '1', '2 mái', 'ngói mũi hài', 'màu đỏ', 'Hỗn hợp', 'nguyên bản', 'Nền trong đình là là đá phiến nhám mịn
Ngoài sân là gạch đỏ', 'lát ô vuông', 'tường bao gạch', 'Nguyên bản', NULL, NULL, 'Đá xanh', 'Chân tảng; 500*500mm, chân tảng nhỏ: 280*280mm', 'Tảng bồng', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('569020a2-7f85-4de1-bf36-9104a212b862', '2113eaa5-1727-4f3c-9f78-f2a426fda3d9', 'Một tầng mái, gian Ống muống 2 tầng mái nhỏ', 'Mái dốc thẳng, chủ yếu là dạng 2 mái.', 'Lợp ngói lót bên dưới và ngói vẩy rồng bên trên', 'Màu đỏ nâu, gạch nung.', 'Gạch xây, trát vữa', 'Lớp vữa đã qua thay thế.', NULL, NULL, 'Kết cấu chính là hệ khung gỗ Lim chịu lực, xung quanh tường xây gạch và trát vữa. Cách đây khoảng 10 năm thì sơn son và vẽ hoa văn nét vàng cho các cột gỗ.', 'Thay thế vật liệu gian ống muống năm 1994, cột gỗ thay bằng cột gạch, tường gạch lỗ.', NULL, NULL, 'Một số cột gian giữa có chân đá tảng bằng đá xanh', '5cmx50cm', 'Loại Tảng bẹt', '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('fea8bc7f-5eab-4e73-8857-4df7be5aa086', '5b72fa35-638b-44c6-ab02-3947ba5a6102', '1 tầng mái', 'Hai mái dốc với đầu hồi bít đốc', NULL, NULL, 'Xây gạch, trát vữa, quét sơn, mái ngói.', 'Thay thế', 'Nền hiên, nền sân lát gạch đỏ 30x30cm. Nền trong nhà lát gạch giả gỗ 15x60cm.', 'Nền hiên lát so le, Nền sân lát chéo mạch, Nền trong nhà lát so le.', 'Bộ khung kết cấu chiu lực gỗ Xoan, tường xây gạch trát vữa, mái lợp ngói.', 'Gần như nguyên bản, có thay thế hoành luồng thành gỗ.', NULL, NULL, 'Đá xanh', '20x20cm (cột hiên)', 'Tảng bẹt', '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('131b87a4-e61f-4cad-868e-3688fbc65863', '821ce853-ea6d-4a82-a68f-c9f22e4a2014', '2 tầng mái', '2 mái', 'Ngói hiện đại', 'Màu đỏ đất', 'Đã được tu tạo (trát vữa, hỗn hợp)', 'Thay thế', 'Gạch giếng đáy', 'Lát vuông', 'Gỗ', 'Nguyên Bản (có sơn lại)', NULL, NULL, 'xi măng', '45cm', 'tảng bồng', '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('6504a406-7fb2-47a8-8edf-70e183f3026e', 'e92783f4-ea38-4375-9555-6751b3ac9129', '1', NULL, 'Ngói ri (đã trùng tu)', 'Mái từ 1894, màu đỏ sẫm, đã được trùng tu', 'gạch', NULL, 'Gạch đã trùng tu', 'Lát công', 'Tất cả đều sử dụng gỗ Lim', 'Có thay thế nhưng không đáng kể', NULL, NULL, 'Đá xẻ', '60cm', 'tảng bẹt', '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('cebb8d0e-255e-4c1a-83ec-281dd9c6396c', '28dc7a86-a741-4fd7-9407-454b6af79bb4', '1 tầng', '2 mái', 'mái ngói đã được tu sửa', 'đỏ đất', 'gỗ', 'nguyên bản', 'đã được tu bổ gạch hoa', 'lát vuông', 'gỗ lim', 'nguyên bản', NULL, NULL, 'đá xanh', '50x50', 'tảng bẹt', '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('2dac2088-d31e-4d06-a76f-c6f103ae2571', '909dd7d6-0c65-4f11-bedf-c6fecd4f9198', '1 tầng', 'ngói mũi hài', NULL, 'màu đỏ đất', 'gạch trát vữa', 'nguyên bản', 'gạch lát hiện đại( đã trùng tu )', 'lát vuông', 'hỗn hợp', 'nguyên bản', NULL, NULL, '40cm , đá xanh', '50 cm( hình bình có chân)', 'tảng bồng', '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('7949a0f2-3f59-446f-ad7c-b7aa45170287', '8ee6fb23-a886-441f-8cd0-ea80804b6e9a', '1 tầng mái', '2 mái', 'ngói mũi hài', 'đỏ đất đã có dấu hiệu xanh rêu qua thời gian', 'gạch', 'nguyên bản có tu sửa', 'gạch đất nung', 'lát chéo', 'hỗn hợp', 'nguyên bản có tu sửa', NULL, NULL, 'không có', 'không có', 'không có', '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('f5923336-e90e-4ddb-ba1c-0d2d114f2227', 'd9f3b97b-8d01-4ea2-afa7-4b0e4d6b8460', '1 tầng mái', 'hai mái', 'mái âm dương', 'đỏ đất đã có dấu hiệu xanh rêu qua thời gian', 'gạch trát vữa', 'nguyên bản có tu sửa', 'gạch bát , gạch giếng đáy', 'lát vuông', 'hỗn hợp', 'nguyên bản có trùng tu một ít', NULL, NULL, 'đá xanh', '30cm', 'tảng bẹt', '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('006a9110-a375-412d-89ce-77e62389d791', 'f5cc6df5-789e-4e33-a718-02219cf0c184', '1', 'Bốn mái, bít đốc', NULL, 'Màu nâu của ngói', 'Gạch và gỗ', 'Xây mới hoàn toàn', 'Gạch 40x40cm', 'Lát công', 'Cột bê tông cốt thép', 'Đại đình xây dựng mới trên nền công trình cũ năm 2019', NULL, NULL, 'Bê tông', '44', 'Tảng bẹt', '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('0430c5ed-54d2-4c1e-b590-8330dd345777', '7929cf67-5bc1-425f-b66e-1200ff174b80', '1', 'Hai mái trước sau', 'https://drive.google.com/file/d/1hezL08xIIZ6HfVBLaauWkMsq9yPyIsxh/view?usp=sharing', NULL, 'Gạch', 'Nguyên bản', 'https://drive.google.com/file/d/1eRnoJeeA5cNUTGUSqMpncTQTnn84iWes/view?usp=sharing', 'https://drive.google.com/file/d/1eRnoJeeA5cNUTGUSqMpncTQTnn84iWes/view?usp=sharing', 'Khung vì kèo gỗ', 'Nguyên bản', NULL, NULL, NULL, NULL, NULL, '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('38dda503-2e07-41bc-91f0-a1df3180e8a5', '309af77b-1057-4d24-90ea-c37e69be4979', '1', 'https://drive.google.com/file/d/1Khio265pbFL9a5MFfQiztasJVYXq28EN/view?usp=sharing', 'https://drive.google.com/file/d/1ItESrYcC8uWwL2b3nT37R9ntSoC6d6fa/view?usp=sharing', NULL, 'Gạch xây cải tạo', 'Xây bổ sung năm 1974', 'Gạch hoa mới cải tạo thay thế', 'Lát vuông', 'Cột gỗ, tường bao gạch, cột hiên xây bằng gạch', 'Nguyên bản', NULL, NULL, 'Đá', '30', 'Tảng bồng', '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('8969a117-0655-43f4-a24f-ec0f128d0c57', '32db5b3c-354d-4b2f-a87c-e04fe72228c2', '1', 'Hai mái', 'https://drive.google.com/file/d/1cqfwSbhIFmYrwltDAufxjaByjI6v4evB/view?usp=sharing', 'Nâu', 'Gỗ và gạch', 'Nguyên bản', 'Gạch 30x30', 'Lát công', 'https://drive.google.com/file/d/1qR9PdQthAcaz387u7gMQQA3jv6qsF8sJ/view?usp=sharing', NULL, NULL, NULL, 'Đá', '30x30cm', 'Tảng bẹt bằng đá', '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('df646c1e-0921-49a3-a509-093dfbfd3586', 'b0cc3513-c04e-423c-912b-b5653534ffdf', '1', 'Hai mái', 'https://drive.google.com/file/d/15_m2l75LBXz-7GXUEC0Nps9go_fdZhxD/view?usp=sharing', 'Nâu', 'Gỗ nguyên bản cho 3 gian giữa và gạch cho 2 gian hồi', 'Nguyên bản', 'Gạch 30x30cm', 'Lát công', 'Gỗ', 'Nguyên bản', NULL, NULL, 'Đá', '22', 'Tảng bẹt', '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('609b8d8a-91c5-4cda-8028-0a8cbcf8726b', '44000000-0000-0000-0000-000000000003', '1', '2 mái', 'ngói đất nung truyền thống', 'màu đỏ gạch nung', 'gạch', 'nguyên bản', 'Nền lát gạch đất nung', 'Lát gạch theo hàng thẳng, mạch song song với trục công trình', 'kết cấu vật liệu gỗ', 'nguyên bản', NULL, NULL, 'đá xanh', '355 x 355 mm', 'tảng bồng', '2026-09-21T07:18:35.222Z', '2026-09-21T07:33:19.884Z')
ON CONFLICT (id) DO UPDATE SET
  "building_id" = EXCLUDED."building_id",
  "roof_layers" = EXCLUDED."roof_layers",
  "roof_shape" = EXCLUDED."roof_shape",
  "roof_material" = EXCLUDED."roof_material",
  "roof_color" = EXCLUDED."roof_color",
  "facade_material" = EXCLUDED."facade_material",
  "facade_condition" = EXCLUDED."facade_condition",
  "floor_material" = EXCLUDED."floor_material",
  "floor_pattern" = EXCLUDED."floor_pattern",
  "structure_material" = EXCLUDED."structure_material",
  "structure_condition" = EXCLUDED."structure_condition",
  "column_height_cm" = EXCLUDED."column_height_cm",
  "column_diameter_cm" = EXCLUDED."column_diameter_cm",
  "pedestal_material" = EXCLUDED."pedestal_material",
  "pedestal_size" = EXCLUDED."pedestal_size",
  "pedestal_type" = EXCLUDED."pedestal_type",
  "created_at" = EXCLUDED."created_at",
  "updated_at" = EXCLUDED."updated_at";
