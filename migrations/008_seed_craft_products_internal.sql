-- Số liệu kinh doanh nội bộ (sản lượng/doanh thu/khó khăn) 1-1 với craft_products.
-- Idempotent: UPSERT theo id cố định.

INSERT INTO "craft_products_internal" ("id", "product_id", "average_output_per_year", "average_revenue_per_year", "current_difficulties", "support_needs", "created_at", "updated_at")
VALUES
  ('25d8c86e-c157-46fc-8bca-0707004d09e6', '56f955bc-6786-4afe-b19d-607c21417a1f', NULL, '500000000', 'Mẫu mã chưa hấp dẫn', 'Kết nối tour du lịch', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('d018bb67-9605-4a57-b892-3c308364f1be', 'd7b4ad1e-464b-4f45-9abd-83d211020568', NULL, '2400000000', 'Thu nhập thấp, vất vả nên không muốn phát triển nghề', 'Không có', '2026-09-21T07:18:17.766Z', '2026-09-21T07:18:17.766Z'),
  ('3893058d-a0a1-47eb-b422-bd9dfc7e25bd', 'cee1b1d2-6f30-44ff-9862-e8c6a0cffe90', '10.000 sản phẩm / năm', '1 tỷ / năm', 'Khó khăn trong đầu ra sản phẩm khi gặp đơn hàng nhiều và thiếu nhân lực', 'Cần hỗ trợ đào tạo kỹ năng đón khách và các kỹ năng liên quan đến chuyển đổi số', '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('b02264a8-813c-40a6-8b8c-6f5a31275119', 'e6e001cc-263b-416c-84b9-3303d54a8097', '~10.000 sản phẩm/năm', '1-2 tỷ/năm', 'Giao thông tiếp cận khó khăn
 Chưa có giá cả niêm yết giữa các nhà
 Việc tìm kiếm thế hệ trẻ tiếp nối nghề rất khó khăn vì kỹ thuật làm sơn mài phức tạp, mất nhiều thời gian, giới trẻ thường không đủ kiên nhẫn để theo đuổi.', 'Cần hỗ trợ về truyền thông và xúc tiến thương mại
 ngoài ra còn có nhu cầu kết nối tuor tuyến du lịch', '2026-09-21T07:18:32.033Z', '2026-09-21T07:18:32.033Z'),
  ('b32969b9-7165-45dc-982f-dc153cca6f76', '5f329317-32e8-4051-8957-fc6e3ad01e31', 'Khoảng 1,000-2,000 sản phẩm', 'Khoảng 1,000,000,000vnd', 'Không', 'Thiết kế mẫu mã, Bao bì, nhãn mác, Xúc tiến thương mại. kết nối tuyến du lịch, đào tạo kỹ năng đón khách', '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('fe63aec9-f406-4674-b310-5096dbe4d7e5', '1b45e114-a6ce-4379-a897-26169e410a95', '180,000 sản phẩm', 'Không', 'Thiếu liên kết du lịch', 'Kết nối tour du lịch, Đào tạo kỹ năng đón khách', '2026-09-21T07:18:32.871Z', '2026-09-21T07:18:32.871Z'),
  ('04034760-dc26-453c-93e3-6a4a5b16810e', '53c85b12-e2af-4d24-a6a4-6f41a57a371a', '10', 'Khoảng 200,000,000vnd', 'Khả năng không bảo tồn được nghề', 'Bao bì, nhãn mác', '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('489bd2f8-d965-4342-9181-0ccc13541bfd', '726a0782-41bc-4d11-bd84-36b5d042b15e', 'Khoảng 4,000', 'Khoảng 300,000,000vnd', 'Thiếu đầu ra của sản phẩm', 'Chuyển đổi số, xúc tiến thương mại, kết nối tour tuyến du lịch, đào tạo kỹ năng đón khách', '2026-09-21T07:18:33.530Z', '2026-09-21T07:18:33.530Z'),
  ('691270c5-bd90-44ad-b2be-8131ade4610f', '1bb19045-ea18-4f64-9235-021d72a313a8', NULL, '7 - 8 tỷ / năm', 'Năng lực quản lý của doanh nghiệp; Quy mô chưa đủ tầm', 'Chuyển đổi số', '2026-09-21T07:18:34.352Z', '2026-09-21T07:18:34.352Z'),
  ('8c3d26f7-5810-40c0-b4a2-53e43f8fcb1f', '7149b013-e68d-4f69-9a0c-7a141d92b38a', 'khoảng 29.000 kg', '360 triệu/ năm', 'Thiếu liên kết du lịch, rất muốn sử dụng facebook để quảng bá nhưng không biết làm, hạn chế tiếp cận lượng khách quy mô lớn', 'Áp dụng TMĐT, sử dụng facebook đưa thông tin', '2026-09-21T07:18:35.222Z', '2026-09-21T07:18:35.222Z')
ON CONFLICT (id) DO UPDATE SET
  "product_id" = EXCLUDED."product_id",
  "average_output_per_year" = EXCLUDED."average_output_per_year",
  "average_revenue_per_year" = EXCLUDED."average_revenue_per_year",
  "current_difficulties" = EXCLUDED."current_difficulties",
  "support_needs" = EXCLUDED."support_needs",
  "created_at" = EXCLUDED."created_at",
  "updated_at" = EXCLUDED."updated_at";
