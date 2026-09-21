-- Gán ảnh đại diện (cover) và panorama/bản vẽ kỹ thuật sau khi bảng media đã
-- có đủ dữ liệu (migration 011). Đây chính là bước từng bị THIẾU ở các
-- migration cũ 018-021 (chỉ insert media cho sites nhưng quên UPDATE
-- sites.cover_media_id) — gộp lại đầy đủ cho cả 6 làng ở đây, không sót nữa.
--
-- Ảnh 360 (panorama): nhận dạng theo tỉ lệ ảnh đúng 2:1 (equirectangular),
-- KHÔNG theo caption — xem ghi chú ở đầu migration 011. 23 site có ảnh 360;
-- site nào chỉ có đúng một ảnh và ảnh đó là 360 thì cover_media_id để trống
-- (frontend đã có placeholder chữ cái đầu) thay vì hiển thị ảnh 360 méo dạng
-- "quả bóng đôi" trên card.
--
-- Reset về NULL trước khi gán lại: các cột này bị loại khỏi UPSERT ở
-- migration 002/004/006 (vì media chưa tồn tại lúc đó) nên nếu chạy trên volume
-- Postgres rỗng, init/04_seed_sample.sql sẽ để lại giá trị placeholder cũ
-- (panorama CC0 Poly Haven) trên 1 vài site mẫu ban đầu — reset đảm bảo kết
-- quả cuối luôn khớp đúng CSDL thật hiện tại (một số site thật sự CHƯA có
-- ảnh 360°/bản vẽ, phải là NULL chứ không phải ảnh placeholder cũ).
-- Idempotent: chạy lại nhiều lần cho kết quả như nhau.

UPDATE villages SET cover_media_id = NULL;
UPDATE villages SET morphology_diagram_media_id = NULL;
UPDATE sites SET cover_media_id = NULL;
UPDATE sites SET panorama_media_id = NULL;
UPDATE heritage_building_technical_details SET floor_plan_drawing_media_id = NULL;
UPDATE heritage_building_technical_details SET section_drawing_media_id = NULL;

UPDATE "villages" t SET "cover_media_id" = v.media_id
FROM (VALUES
  ('01000000-0000-0000-0000-000000000001'::uuid, 'aef52a73-4dde-4edf-9c54-e08ba739d014'::uuid)
) AS v(id, media_id)
WHERE t.id = v.id;

-- (không có villages.morphology_diagram_media_id nào cần gán)

UPDATE "sites" t SET "cover_media_id" = v.media_id
FROM (VALUES
  ('010f644d-0f9d-4977-b357-138f306501e2'::uuid, '2b8f688c-dea2-4876-94b7-132e89f3e5a3'::uuid),
  ('03111ee1-5fca-41d0-888e-9bb7f58a31b2'::uuid, 'a7f493a7-e3b5-4ef3-8cbe-c8cdeb131034'::uuid),
  ('0556a156-a3e3-4d29-8885-91ac17dcecb9'::uuid, 'a6a5b60c-12a8-471d-9939-8f73a88303fc'::uuid),
  ('05777db9-c92b-4da6-9f66-2833674f6ad5'::uuid, '16e8ca41-23b3-4bd5-993b-030c112a4e59'::uuid),
  ('0b8904ea-3cca-4609-9d61-fdeb8c753881'::uuid, '03a0d2b3-7628-42c8-8307-c8615744fdb1'::uuid),
  ('0d0db01e-2bbf-4d28-a289-c9c2bdc9a3c7'::uuid, '3785f9a9-cd3d-44a6-a248-4175442e51f5'::uuid),
  ('15d48e54-3790-4900-9e87-df730349392f'::uuid, 'c293eb2f-0f84-464d-a29d-1ae0d36cfab9'::uuid),
  ('1c2471bb-ae76-43fa-a3bf-97fdd76e5ce4'::uuid, '7dfaff17-7e72-4741-b443-1432363ec8ad'::uuid),
  ('1cc62aa3-f869-4470-92fe-2a4d62c366a8'::uuid, '0cefd584-c02c-432c-a4fe-76884a397ccc'::uuid),
  ('20000000-0000-0000-0000-000000000001'::uuid, 'a4a8dec6-1cb3-4773-83a9-d4e78363abdc'::uuid),
  ('20000000-0000-0000-0000-000000000002'::uuid, '56ddf93d-ef63-4ecb-afa2-de94ab1ec154'::uuid),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'a9a973fe-725d-4eec-b818-22e86127d74b'::uuid),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'fd26ab91-dbaa-4c84-9279-d080ed2db325'::uuid),
  ('20000000-0000-0000-0000-000000000005'::uuid, '30000000-0000-0000-0000-000000000005'::uuid),
  ('20000000-0000-0000-0000-000000000006'::uuid, '53ab9052-d037-4ee2-8693-bddca638db5f'::uuid),
  ('20000000-0000-0000-0000-000000000007'::uuid, '9b8404b3-a7ca-4dd9-9391-1587f4ff914d'::uuid),
  ('20000000-0000-0000-0000-000000000008'::uuid, 'dcef4a11-b1a1-4594-a986-0bcc12fdd03e'::uuid),
  ('20000000-0000-0000-0000-000000000010'::uuid, '3722c3ba-14ac-4d31-a7cb-7df911859b6f'::uuid),
  ('20000000-0000-0000-0000-000000000011'::uuid, '7d76273a-9d01-4547-9c6b-e56cf24d0f26'::uuid),
  ('20000000-0000-0000-0000-000000000012'::uuid, '0fe8039c-8f53-4083-b526-e479013bdd1a'::uuid),
  ('20000000-0000-0000-0000-000000000013'::uuid, '67c7c406-61ae-4d0e-b09f-7f560a3cf4b7'::uuid),
  ('20000000-0000-0000-0000-000000000014'::uuid, '82f45ce3-22ee-47cb-a429-2ef5bc2e8663'::uuid),
  ('20000000-0000-0000-0000-000000000016'::uuid, 'eb9d5804-4e9f-4d10-807b-556e71f48d01'::uuid),
  ('20000000-0000-0000-0000-000000000019'::uuid, 'f2d88db7-929d-49fa-8c06-27f0b30f0002'::uuid),
  ('20000000-0000-0000-0000-000000000020'::uuid, 'c7a18111-2948-4765-aa00-82aa8388c477'::uuid),
  ('21000000-0000-0000-0000-000000000001'::uuid, '3caacaa5-6908-4892-94a1-bde20cb29d03'::uuid),
  ('21000000-0000-0000-0000-000000000003'::uuid, '8525b395-195f-47a6-8bba-bf6c9099de73'::uuid),
  ('21000000-0000-0000-0000-000000000004'::uuid, 'f9c7156a-f2c7-440a-8848-b87c41c553f4'::uuid),
  ('21000000-0000-0000-0000-000000000005'::uuid, 'fa634fd2-81bd-4196-84c8-f8e084f2f3be'::uuid),
  ('21000000-0000-0000-0000-000000000006'::uuid, '5cf40a81-63e5-4284-933b-6572e13d64f3'::uuid),
  ('21000000-0000-0000-0000-000000000007'::uuid, '25a5f282-0398-409d-8cb3-eca7c38bbb3c'::uuid),
  ('21000000-0000-0000-0000-000000000008'::uuid, 'e21516c2-d281-41dd-8cd1-bd81a2242e68'::uuid),
  ('21000000-0000-0000-0000-000000000009'::uuid, '5b3324ed-e842-417d-bc18-1ae6b715f7d9'::uuid),
  ('21000000-0000-0000-0000-000000000010'::uuid, 'a5e67258-f93b-4288-834f-1cac764e02aa'::uuid),
  ('21000000-0000-0000-0000-000000000011'::uuid, '94e97152-6bda-4806-abc7-b2b41461ad42'::uuid),
  ('21000000-0000-0000-0000-000000000012'::uuid, '8559ce87-68a6-4412-bc7f-09cf07d61c89'::uuid),
  ('21000000-0000-0000-0000-000000000013'::uuid, 'b20a2743-7e10-4842-9c5c-95b3f61984bd'::uuid),
  ('21000000-0000-0000-0000-000000000014'::uuid, 'd3cd9de7-6642-487b-816e-c877ca52833d'::uuid),
  ('21000000-0000-0000-0000-000000000015'::uuid, '0b29a4d9-8ed0-4cbd-a8ac-ea45578640fd'::uuid),
  ('21000000-0000-0000-0000-000000000016'::uuid, '42bbdf20-e577-4df1-9f59-ab78dccb2cf7'::uuid),
  ('21000000-0000-0000-0000-000000000017'::uuid, 'e4a074a8-916e-41da-91e1-58236c64ab5b'::uuid),
  ('21000000-0000-0000-0000-000000000018'::uuid, '3f6916bf-46ea-4718-827d-e6be12f0dbd8'::uuid),
  ('21000000-0000-0000-0000-000000000019'::uuid, 'b66e95d3-8f5e-42c4-b6e2-0e87c10b83e2'::uuid),
  ('21000000-0000-0000-0000-000000000020'::uuid, 'e2cf5a74-a0c2-4e72-91db-c0770ff91203'::uuid),
  ('21000000-0000-0000-0000-000000000021'::uuid, '6487981d-5192-46ab-85ba-2838d8f812c9'::uuid),
  ('21000000-0000-0000-0000-000000000022'::uuid, 'b8c5f58f-4a6f-437c-9d01-eba2701205ea'::uuid),
  ('21000000-0000-0000-0000-000000000023'::uuid, '830630d3-7b6e-4126-a5de-be10ff15e872'::uuid),
  ('297a57a6-4bcc-40fd-8b3b-761f984ff0fd'::uuid, '3f75ada5-555a-459b-a039-ac3136240c67'::uuid),
  ('2c84ff41-5bbe-4314-b600-a89f0735e9d0'::uuid, '269fbf49-6a9b-45f0-a0c9-8dce7ee0f658'::uuid),
  ('2d807452-23ae-46f0-9d24-753bea18f1f1'::uuid, 'a67f6532-b995-49fc-80f0-a66839742da5'::uuid),
  ('2edf0cc8-fdba-44ff-b83c-5aea246a11b9'::uuid, '1b9c9a9e-97f4-4e42-b816-85c40412a28c'::uuid),
  ('2fb52b97-503f-4f3f-8ed0-26595709db20'::uuid, 'addb9cd5-c3dd-46ab-b851-d76864947c1f'::uuid),
  ('3b890288-8a15-4484-a53f-444775d8fd20'::uuid, 'd716fedd-81ac-4975-93e4-e1fc6a8a258f'::uuid),
  ('4182fd39-6d5e-4a40-b050-4f141bc860a4'::uuid, 'e3737f63-a8e2-4779-9c54-3f65c4959c75'::uuid),
  ('4b9b87fb-0c41-43b4-81a5-38678458a9db'::uuid, 'd4c826dd-3d14-4a7e-b55a-3dc813678dab'::uuid),
  ('4c9de4f0-3b78-4ad2-b856-a6b635f3514b'::uuid, '9fd27d6d-2756-4269-9cbb-e17ca3473cd0'::uuid),
  ('50cc1810-1a41-4d00-9bf6-d12465585123'::uuid, 'adf2d286-d5c4-4c55-9426-6f4744c30236'::uuid),
  ('53fa7c45-dac2-49cc-a4c1-11f6a7db5c24'::uuid, 'ea3bae9b-e217-4b55-add3-166056567e72'::uuid),
  ('5b519f6e-5d64-4d9b-9623-cb4e78f666cb'::uuid, '9f2d3c5d-aae2-4861-ace5-9942fbc36fbc'::uuid),
  ('5d6055d9-7ed7-4889-baf6-60b590360815'::uuid, 'a0383b4a-1dcf-4bea-bd13-00bad51a4a90'::uuid),
  ('5e1d7cfb-ad82-4bc9-99ab-dee66e8f0911'::uuid, '1e748c5f-e8ea-4a62-bc1e-0c48a73aeb27'::uuid),
  ('5ebaa055-99e0-4897-97c3-0170cbb6d381'::uuid, 'a1192cf2-e61d-44da-bfc2-45f0805381ab'::uuid),
  ('60217152-a88b-4f05-8ee9-593985d9fb23'::uuid, 'ea6dc5d0-8601-40b5-ac9a-3aee5b66605e'::uuid),
  ('616bf014-5516-44ce-80c3-7d52190f1da3'::uuid, 'e47c7239-1603-4f24-941d-786d4ee79c58'::uuid),
  ('66cf0b99-c24b-447c-b3f4-7d2d2a506cb7'::uuid, '20ef360d-5048-4662-94a5-cffb58cbacd7'::uuid),
  ('67a60076-5af3-4f6c-89d8-69e21342b36d'::uuid, 'd50bdba5-0f4e-48ae-bd56-5f910abe054c'::uuid),
  ('6940e1f3-7220-4ad7-b51e-98b86692df7c'::uuid, 'f61a2137-8f23-4c95-b6e2-d0ff46885dff'::uuid),
  ('6b618c65-7d7c-4287-accc-1845babb35cc'::uuid, '66fac027-8aa7-444d-a5cc-b881b610019a'::uuid),
  ('6e4bdb96-4631-4af9-80d2-ff2a3f29bf8c'::uuid, 'd899e960-389d-4472-a9b1-922ee984db1b'::uuid),
  ('6e5fc28f-9e4f-4290-8801-e97581ef232f'::uuid, '6b745826-fcad-476b-b4be-14a7dc65ea55'::uuid),
  ('72157e2d-8d22-4022-b4be-18e3b63f3e4f'::uuid, '61f18571-1927-44be-853a-1219cc51cd6d'::uuid),
  ('743a1c86-b0f5-4d4b-a6d8-ed2fe6444edc'::uuid, 'e1cbd163-b746-4aa9-90ad-8ebb5a16f4b6'::uuid),
  ('78ba5481-fe5f-41a4-b64c-ca81e771ce53'::uuid, '71d61460-8d41-4597-83dd-a6d57ee2c834'::uuid),
  ('78cb2d2e-69b3-42f3-8b28-5c5b9031961f'::uuid, '3f338c54-0f5c-41ad-a8a4-5194337626b9'::uuid),
  ('7ca23109-cf2c-4020-97da-ba3c67033918'::uuid, 'def1e6a8-a209-44ff-bb7d-76087784a6f3'::uuid),
  ('7d904c2e-ee19-480f-a93a-62c2f2810b6a'::uuid, 'db0525b9-a1d8-48bc-86e7-6626a62dd105'::uuid),
  ('889cf51e-4283-401e-bef4-78bef4e0f992'::uuid, 'ec76f089-54fe-4c6f-8729-d46ff4826859'::uuid),
  ('9b2adb32-b607-419d-a5c3-69894a2d5c66'::uuid, 'f38b80ce-065b-4e82-95b6-4b1953786d21'::uuid),
  ('9c831ce5-2e1e-4468-b09c-27ee3a032d5a'::uuid, '992068a5-554f-4066-a9d9-5436bb984fde'::uuid),
  ('9ec04fb9-9aef-4c12-9f47-bfc19872c0b2'::uuid, '1f7b9db3-50b4-41b4-8617-5b53f7bcba73'::uuid),
  ('a2c635e8-d3df-455e-bd55-f9aaa9e75507'::uuid, '34aca392-9c7b-4801-a445-9f363be35a8d'::uuid),
  ('aca31262-bb0a-47ee-8543-b7b8003ead58'::uuid, '229f8640-291a-4335-aa99-218c5cce3a00'::uuid),
  ('b008170d-a82b-4604-9220-5cc6f0f9e2a7'::uuid, '5f0d6299-5902-4943-a95e-3b61778c8cc4'::uuid),
  ('b052b7f7-f771-4f18-8457-f4acc92c9b8d'::uuid, 'f5860608-9c86-490f-a9bb-5e7d307ce66c'::uuid),
  ('b22e7458-33f4-46d7-a833-fa949d15fed0'::uuid, '86b9092e-0d1d-4190-a79d-ee32fa175ee9'::uuid),
  ('b7a1677b-f9ea-4a8d-9d1d-5c73ab4ba178'::uuid, '759452b0-acd1-4cfa-ba1a-52079677487b'::uuid),
  ('bffd491e-5b22-49d1-b77b-377edd25664a'::uuid, 'c8d93c56-1c23-4c10-a631-d588f40108d4'::uuid),
  ('c1ed694a-3a3d-4eab-bd63-18c619cd15be'::uuid, '67358cdb-545f-46c7-92a3-d2fddd14eef3'::uuid),
  ('c28846f5-ea72-460b-aa45-d9c3d3bb15a6'::uuid, '0ce8f1c8-2771-45ae-968b-46011d0b2db4'::uuid),
  ('c2b27d51-0c70-452a-b018-45cf6d7e9c56'::uuid, '1690a67a-0dc8-41f6-849d-3cbd1393ea06'::uuid),
  ('c7ed2238-2c52-42ce-af48-c0dd241e6ef3'::uuid, '20a3f59d-6a00-447d-af52-abb96e8dec13'::uuid),
  ('cb162594-8acc-419f-8e48-2ccf168f6288'::uuid, '3779a55e-746f-4ef5-b475-25d38eda93c0'::uuid),
  ('ceb78e41-82e6-4d87-8155-7ea70ec1a83e'::uuid, 'f00dc361-ab8f-4d6a-b253-71689346e8fd'::uuid),
  ('d198a4db-d65d-4136-88d7-fe4692f03199'::uuid, 'ce895417-c8e4-4dee-b152-d9eb0fc65c69'::uuid),
  ('d3802314-f819-40eb-9447-8d6f23b2a7b6'::uuid, '210eb910-2ec4-46fa-bcb4-b8fba1ab6228'::uuid),
  ('d813ed0d-366c-4aff-b7b0-033dad2906d4'::uuid, '86b37b71-bca1-426e-b33c-ea2e00bd7895'::uuid),
  ('de1a0d7d-37f8-4134-b172-1a739c3fa419'::uuid, 'd2b35ee0-8d60-4e0e-a09f-c716becbdc2e'::uuid),
  ('e689ba8b-cf6e-4826-a469-dfc732526f3b'::uuid, '262c9215-cc46-4ac6-9201-1874ce1f195f'::uuid),
  ('f27421bb-5b83-4c77-acdc-7d3c68f220af'::uuid, '72aed6c4-fcd3-4b88-b18f-a21a436ccf05'::uuid),
  ('f8687aff-58a8-4df9-bdb1-7fa8db6417d1'::uuid, 'ea96239d-b238-4bb5-95c8-841ef0617ece'::uuid),
  ('fafa82e9-5d72-42aa-a059-1cdcce1ba4ea'::uuid, '634d87dc-ac9f-4927-a015-d6246fedbf35'::uuid)
) AS v(id, media_id)
WHERE t.id = v.id;

UPDATE "sites" t SET "panorama_media_id" = v.media_id
FROM (VALUES
  ('106ce802-8e72-434c-9868-3d31349edf42'::uuid, '0e4dd81d-fccb-4c3b-a568-50feae11c89f'::uuid),
  ('1d8169b9-ba0f-4f00-b00a-eee0a512c7ad'::uuid, 'e246ec92-0dcf-4cc1-966c-9358f1a0d225'::uuid),
  ('20000000-0000-0000-0000-000000000001'::uuid, '64d344bc-9fac-4674-a66e-0868395e7f09'::uuid),
  ('20000000-0000-0000-0000-000000000002'::uuid, '621b3b73-f88e-45c8-920a-3f40f3ebc847'::uuid),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'fa2eb908-9ea5-4743-ab85-6038e85d3099'::uuid),
  ('20000000-0000-0000-0000-000000000014'::uuid, '2ecabcc9-3df5-4426-b069-fe888ad9984d'::uuid),
  ('20000000-0000-0000-0000-000000000018'::uuid, '7e360000-0000-4360-8000-000000000001'::uuid),
  ('21000000-0000-0000-0000-000000000002'::uuid, '4fb5a9b5-3760-4c29-9b7a-6142fc416ba4'::uuid),
  ('225152ae-cf96-485a-8fb4-5956bbd9bcff'::uuid, 'c1623f5b-1ecc-483d-8a66-ce205a146a44'::uuid),
  ('41033f55-90ea-4539-aba1-1ea4ed330048'::uuid, 'c1df5703-d8dd-4049-b76c-0ffd049eead2'::uuid),
  ('495a71f9-99a3-418f-98ad-eff84975c53f'::uuid, '87a842a9-8588-452a-a36e-7e4abfd06e56'::uuid),
  ('50800f73-2fe4-483f-8b4a-4177688cd00a'::uuid, '44959b58-3307-4e48-8635-086b74b9378b'::uuid),
  ('60353b9d-c4e4-4d1e-a186-5b75ba80984a'::uuid, 'c8f339e6-0529-472d-9237-b099b18bff1d'::uuid),
  ('7cf72fe0-3aa2-4c0e-9c57-e926d04db3ba'::uuid, '4ea27482-0697-410f-9f0f-f82330802d3a'::uuid),
  ('8322ba72-4b66-4d0d-911b-61ea10332a97'::uuid, '66fed655-b83e-4ad1-abeb-7367e15922b9'::uuid),
  ('8987a84a-b2d7-4423-86b9-94d27953c155'::uuid, 'c9d8bc31-098f-4a29-b31c-f395e856a46e'::uuid),
  ('a8c52c9f-dd7e-4ae6-904b-d65e844579c6'::uuid, '8b053f5c-329a-4bd6-b9bb-54ea8886e6c3'::uuid),
  ('d30f9f94-feed-4c29-9d7d-9eae85b19a33'::uuid, '54362989-823f-48da-8b0b-5c45dbc28170'::uuid),
  ('d49c5ca9-4e36-4c36-b31d-417f813d6dcc'::uuid, 'ba9b0df5-8b3f-432f-9963-9d2e2173b826'::uuid),
  ('d5b7ab2f-ca77-44f3-abfc-bbf37260bc50'::uuid, 'b5a03a49-a17b-4093-922b-d8c74da96fa9'::uuid),
  ('e39832de-c992-4295-b9e4-302aff37cbca'::uuid, 'f49a3f27-4ce9-4269-8741-47e820f7f93b'::uuid),
  ('f06f841f-b468-4f92-b6c6-72dd66815c99'::uuid, 'c8c95e67-c125-49a4-9dec-70fd3e85a14d'::uuid),
  ('f15021e9-5cee-4574-8b56-6d22a288dcf1'::uuid, '0711e7d6-28f5-4a4b-8f5e-18a7bf9a53d0'::uuid)
) AS v(id, media_id)
WHERE t.id = v.id;

-- (không có heritage_building_technical_details.floor_plan_drawing_media_id nào cần gán)

-- (không có heritage_building_technical_details.section_drawing_media_id nào cần gán)
