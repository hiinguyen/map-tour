# Review lượt 3: kết quả Antigravity nộp sau review2.md, kèm nghiệm thu runtime

Ngày review: 2026-09-22.
Người review: Claude.
Đối tượng: cây làm việc sau khi Antigravity sửa theo `review2.md`, chưa commit.
Đọc kèm `review.md` (mã R1 tới R8) và `review2.md` (mã R9 tới R12).

Lượt này là lần đầu **mục 6 được chạy thật**, không còn tiêu chí nào ở trạng thái chưa xác minh.

## 0. Cách xác minh

Tôi vẫn không đọc được session của Antigravity.
Mọi kết luận lấy từ cây làm việc, từ cơ sở dữ liệu đang chạy, và từ trình duyệt thật.

Môi trường đã dựng: Postgres trong Docker, API trên cổng 8787, Vite trên cổng 5173, `public/tiles/vietnam.pmtiles` có mặt với dung lượng 568 MB.
Trước mọi lệnh ghi vào cơ sở dữ liệu tôi đã sao lưu: `backups/lang_uoc_le_20260922-211727.sql.gz`.

```
cd map-tour/server && npm test      -> Test Files 5 passed (5), Tests 71 passed (71)
cd map-tour/server && npm run build -> exit 0
cd map-tour && npx tsc -b           -> exit 0
```

Số test tăng từ 64 lên 71, và có file mới `kmlCommit.test.ts` với 7 ca.
Đúng yêu cầu của `review2.md` mục 7 là số test phải lớn hơn 64.

## 1. Kết luận

**Chưa pass, nhưng phần lõi đã chạy được end to end.**

Toàn bộ mười hai mã của hai lượt trước đã đóng.
Mười ba tiêu chí runtime của mục 6 đã nghiệm thu bằng số đo thật.
Còn bảy điểm chưa đạt, đánh số R13 tới R19, trong đó một điểm là lỗi quy cách của tôi.

Không điểm nào trong bảy điểm đó đòi viết lại kiến trúc.
Nặng nhất là R13, vì nó ghi dữ liệu sai vào cơ sở dữ liệu mà không ai biết.

## 2. Đã đóng trong lượt này

**R7 guard idempotent.**
`kmlCommit.ts` giờ lọc theo tỉ lệ diện tích trong khoảng 0,5 tới 2 lần trước khi coi là trùng, nên một công trình nhỏ nằm trong một khuôn viên lớn không còn bị bỏ.
Có counter riêng `skippedDuplicateCount` trong `KmlCommitSummary`.
Đã kiểm thực nghiệm rằng hai counter chạy độc lập: khi đặt một hàng thành `admin`, kết quả trả về là `protectedCount: 1` và `skippedDuplicateCount: 0`.

**R9 hết nhân bản phép toán.**
`kmlCommit.ts` import `isPointInPolygon` từ `./geo.js`.
Hàm cục bộ đã bị xoá.

**R10 hết N+1.**
Truy vấn lấy ranh giới sẵn có đã nâng ra ngoài vòng lặp, và danh sách trong bộ nhớ được bổ sung sau mỗi lần INSERT thành công nên vẫn phát hiện được trùng trong cùng một transaction.

**R11 hết monkeypatch.**
`focusSite` giữ trong `focusSiteRef` là một `useRef`, có dọn về `null` khi unmount.
Hàm nhận thêm tham số `source` kiểu `'deeplink' | 'list' | 'map'`.

**R12 hết dấu gạch dài** trong `kmlCommit.ts`.

**Các ràng buộc chống hồi quy vẫn giữ.**
Ba hằng marker vẫn ở 16, 32, 18.
`index.css` chỉ thêm 8 dòng và không đụng vùng `.tour-marker`.

## 3. Mục 6 đã nghiệm thu, mười ba tiêu chí đạt

Tất cả số dưới đây là số đo, không phải suy luận.

**Tầng hạ tầng.**
`vietnam.pmtiles` trả `206 Partial Content` cho một request 100 byte, không GET toàn file.

**Camera, tiêu chí T7.1.**
Mở `?site=20000000-0000-0000-0000-000000000005`.
Đo tỉ lệ bằng khoảng cách giữa hai marker đã biết toạ độ, ra 0,2786 mét trên pixel, tương đương zoom khoảng 19.
Polygon 156 x 125 mét chiếm 560 x 449 pixel trên khung 1146 x 679, và marker của nó nằm đúng tâm ngang của khung.
Các marker khác trải từ y bằng âm 393 tới y bằng 1369, tức cả làng đã tràn ra ngoài khung.
Camera khung vào polygon, không đứng ở mức toàn làng.

**Khoá tương tác.**
`document.querySelector('.maplibregl-canvas').tabIndex` trả về `-1`.
`maplibregl-canvas-container` **không** mang class `interactive`, nghĩa là MapLibre không gắn listener nào, nên bánh xe chuột đi thẳng xuống trang.

**Nội dung bản đồ khoá.**
Chip đọc `DIỆN TÍCH KHUÔN VIÊN | 13.406 m² | ≈ 125 × 156 m`.
Thước đọc `50 m`.
Caption có mặt và mô tả đúng hình.

**Vị trí section, tiêu chí T7.7.**
Thứ tự h2 trên trang là: Thông tin khảo sát, **Quy mô khuôn viên**, Giới thiệu, Điểm di sản lân cận.

**Bề rộng 390 pixel, viewport thật chứ không phải co container.**
Khung đổi sang tỉ lệ 1,33 tức 4/3, đúng media query.
Chip và thước không chồng nhau, kiểm bằng phép so hai hình chữ nhật.
Trang không tràn ngang.

**Khung lại khi đổi kích thước.**
Khi khung co từ 1160 xuống 310 pixel, thước đổi từ `50 m` sang `200 m` và polygon vẫn đủ padding.
Đường `map.on('resize')` rồi `fitBounds` có hoạt động.

**Vòng tròn dự phòng.**
Ca thử là `Đình làng Cự Đà`, chưa có ranh giới, khảo sát ghi 553,13 mét vuông.
Badge đọc `Chưa khảo sát ranh giới`, chip đọc `DIỆN TÍCH KHẢO SÁT | 553 m² | bán kính phỏng đoán ≈ 13 m`, caption đúng bản đã chốt.
Bán kính suy ra là 13,269 mét nên đường kính là 26,54 mét.
Thước đo 72 pixel cho 10 mét, tức 0,1389 mét trên pixel, nên đường kính kỳ vọng là 191 pixel.
Đường kính vẽ thật đo được 190 pixel sau khi hiệu chỉnh hệ số co của ảnh chụp.
Kiểm riêng phép toán: 64 đỉnh của `circlePolygon` đều cách tâm 13,2542 mét, sai 0,11 phần trăm so với yêu cầu, và vòng tròn tròn tuyệt đối nên số hạng `cos(lat)` đúng.

**Console.**
Sạch.
Không cảnh báo missing-image cho `footprint-hatch`, không 404 worker, không `Unable to perform style diff`.
Chỉ còn hai cảnh báo future flag của React Router vốn có từ trước.

**Popup.**
Bấm vào polygon mở popup đúng nội dung, không lỗi JavaScript.

**Nạp lại cùng file KML.**
Hai lần commit cùng payload đều trả `updatedCount: 14, createdCount: 0, skippedDuplicateCount: 0`.
Số site giữ nguyên 77 điểm và 55 khu vực trước và sau.
Idempotent đạt.

**Bảo vệ bản sửa tay.**
Đặt tạm một hàng thành `boundary_source = 'admin'` rồi commit lại: kết quả `updatedCount: 13, protectedCount: 1`.
Đã hoàn nguyên hàng đó về `kml`.

**Một đối chiếu đáng tin.**
`Đình làng Ước Lễ` cho diện tích 2.499 mét vuông từ polygon vẽ tay, so với 2.500 mét vuông khảo sát.
Lệch 0,04 phần trăm.
Đây là bằng chứng mạnh rằng cả đường nhập KML và phép tính diện tích đều đúng.

## 4. Bảy điểm chưa đạt

### R13. Dòng nhập nhằng được ghi mà không cần xác nhận tay

Mức: **nghiêm trọng**, vì nó ghi dữ liệu sai và không hiện ra ở đâu.

Hiện trạng.
Endpoint parse trả về 5 dòng `ambiguous`, và **cả 5 đều đã có `selectedSiteId` điền sẵn**.
Trong đó có hai dòng tên `Nhà cổ` với 3 ứng viên và điểm số 40, tức đúng ngưỡng thấp nhất được coi là nhập nhằng.
Khi commit, `kmlCommit` thấy `selectedSiteId` có giá trị nên ghi luôn.
Đó là lý do `updatedCount` là 14 chứ không phải 9.

Vì sao sai.
`plan.md` mục T9 ghi: không bao giờ ghi `fuzzy` hoặc `ambiguous` mà thiếu xác nhận từng dòng trong payload commit.
Một dòng có 3 ứng viên ngang điểm là một phép tung đồng xu.
Ghi mặc định nghĩa là người dùng bấm commit một lần là ranh giới rơi vào site sai, và không có gì báo.

Phải làm.
Parse trả `selectedSiteId: null` cho mọi dòng `ambiguous`.
Giao diện phải buộc chọn trước khi cho commit.
`kmlCommit` giữ nguyên hành vi bỏ qua khi `selectedSiteId` rỗng.

Nghiệm thu.
Parse lại file Ước Lễ, không dòng `ambiguous` nào có `selectedSiteId`.
Commit ngay payload chưa sửa, `updatedCount` phải là **9**, và 5 dòng nhập nhằng phải được báo là chưa chọn.
Chọn tay một dòng rồi commit, `updatedCount` thành 10.

### R14. `popupHtml` không phát dòng diện tích

Hiện trạng.
`TourMap.tsx` dòng 238 tới 245, `popupHtml` chỉ dựng tên, mô tả và nút 360 độ.
Không có `map-popup__area` ở bất kỳ đâu trong mã nguồn.
Đã kiểm trên trình duyệt: popup của `Đình làng Ước Lễ` không có dòng diện tích.

Vì sao sai.
`plan.md` mục T7 yêu cầu popup thêm một dòng khi feature có diện tích.
Ngoài ra `index.css` đã được thêm khối `.map-popup__area`, nên hiện có CSS chết.
Một trong hai vùng thay đổi được phép ở `index.css` đang không phục vụ gì.

Phải làm.
Thêm dòng diện tích vào `popupHtml` khi site có ranh giới, dùng `formatAreaM2`.
Nếu quyết định không làm thì phải xoá khối CSS tương ứng, không để lại CSS chết.

Nghiệm thu.
Bấm polygon `Đình làng Ước Lễ`, popup hiện `2.499 m²`.
Bấm một site chỉ có điểm, popup không có dòng đó.

### R15. Route parse hỏng khi truyền slug, và lỗi cơ sở dữ liệu lọt ra ngoài

Hiện trạng.
`adminKml.ts` tra làng bằng `WHERE id::text = $1 OR slug = $1`, tức có ý hỗ trợ slug.
Nhưng truy vấn site ngay sau đó dùng `WHERE s.village_id = $1` với tham số thô.
Gọi thật với `villageId=lang-uoc-le` trả về HTTP 400 kèm nguyên văn `invalid input syntax for type uuid: "lang-uoc-le"`.

Vì sao sai.
Hai lỗi trong một.
Một là API hứa nhận slug nhưng không nhận.
Hai là thông báo lỗi nội bộ của Postgres lọt ra client, trái quy ước là thông báo lỗi không được để lộ chi tiết nội bộ.

Phải làm.
Dùng `villageRes.rows[0].id` cho truy vấn site.
Bọc lỗi lại thành thông báo tiếng Việt cho người dùng, ghi chi tiết vào log phía server.

Nghiệm thu.
`villageId=lang-uoc-le` trả 200 và cho cùng kết quả như khi truyền UUID.
Một `villageId` rác trả thông báo tiếng Việt, không có chữ `uuid` hay tên kiểu dữ liệu nào trong phản hồi.

### R16. Nhánh `inView` là mã chết, quyết định "chỉ di khi cần" chưa được cài

Hiện trạng.
`focusSite` nhận `source` kiểu `'deeplink' | 'list' | 'map'` và chỉ kiểm `inView` khi `source === 'map'`.
Nhưng trong toàn bộ `src` chỉ có hai lời gọi: dòng 433 truyền `'deeplink'`, dòng 523 truyền `'list'`.
Không nơi nào truyền `'map'`.

Mà bấm ghim và bấm polygon đều đi qua `onSelect`, rồi `setSelectedId`, rồi chính effect ở dòng 523.
Nên mọi cú bấm trên bản đồ được coi là `'list'` và camera **luôn** di.

Vì sao sai.
Người dùng đã chốt hành vi "chỉ di khi cần", cụ thể là bấm một ghim đang hiện rõ trước mắt thì không giật.
Hiện chưa có hành vi đó, và nhánh code dành cho nó không bao giờ chạy.

Phải làm.
Phân biệt nguồn chọn ở tầng `MapPage`, vì `TourMap` là nơi phát ra cú bấm bản đồ còn `SiteList` là nơi phát ra cú bấm sidebar.
Truyền `'map'` cho cú bấm ghim và bấm polygon, `'list'` cho sidebar, `'deeplink'` cho lần đầu đọc `?site=`.

Nghiệm thu.
Bấm một dòng sidebar xa khung hiện tại, camera di.
Bấm một ghim của site có ranh giới đang nằm gọn giữa khung và rộng hơn 8 phần trăm bề ngang, camera **không** di.
Mở deep link tới `Khu làng cổ`, camera vẫn khung vào polygon.

### R17. Caption thiếu câu nói bản đồ bị khoá

Hiện trạng.
Caption thật là: `Ranh giới khuôn viên Khu làng cổ trên nền bản đồ làng. Diện tích khoảng 13.406 m², tương đương một khu đất chừng 125 × 156 m.`
Thiếu câu `Bản đồ này không thu phóng được.`

Vì sao sai.
Toàn bộ vùng bản đồ đã bị `aria-hidden`, nên caption và chip là bản tương đương duy nhất cho người dùng trình đọc màn hình.
Không có câu đó thì họ không được cho biết bản đồ bị khoá, và sẽ tưởng mình đang không tương tác được vì lỗi.

Phải làm.
Thêm câu `Bản đồ này không thu phóng được.` vào cuối caption ở cả hai nhánh có ranh giới và chưa có ranh giới.
Nên thêm cả số đọc của thước dạng `Thanh tỷ lệ: 50 m.`, vì thước cũng nằm trong vùng aria-hidden.

Nghiệm thu.
`take_snapshot` cho thấy caption chứa câu đó, ở cả hai nhánh.

### R18. Vùng `aria-hidden` chứa hai link bấm Tab vào được

Mức: lỗi tiếp cận thật, nhưng **quy cách sai là của tôi**, không phải Antigravity làm sai yêu cầu.

Hiện trạng.
Hai link attribution `OpenMapTiles` và `OpenStreetMap` có `tabIndex: 0` và nằm trong vùng `aria-hidden="true"`.
Đã kiểm bằng `a.closest('[aria-hidden="true"]')`, cả hai trả `true`.

Vì sao sai.
Đây là vi phạm WCAG mà axe gọi là `aria-hidden-focus`, mức serious.
Người dùng bàn phím Tab được vào chúng, còn trình đọc màn hình không đọc gì.
Đó đúng là điểm dừng tab chết mà `plan.md` viết ra để tránh cho canvas, nay xảy ra ở chỗ khác.

Nguồn gốc.
`plan.md` mục 6 phần tiếp cận ghi rằng `aria-hidden="true"` trên container sẽ loại canvas, thước và attribution khỏi accessibility tree.
Câu đó của tôi sai, vì attribution là link bấm được chứ không phải trang trí.

Phải làm.
Đặt `aria-hidden` lên đúng phần tử canvas, không lên cả container.
Hoặc giữ container nhưng đưa control attribution ra ngoài vùng aria-hidden.
Không được xử lý bằng cách đặt `tabindex="-1"` lên link attribution, vì giấy phép bản đồ phải truy cập được.

Nghiệm thu.
Không phần tử focus được nào nằm trong vùng `aria-hidden`.
Tab từ link trước section vẫn bỏ qua canvas, nhưng dừng được ở link attribution và trình đọc màn hình đọc được nó.

### R19. Chip che mất polygon ở bề rộng 390 pixel

Hiện trạng.
Ở viewport 390 pixel, khung rộng 357 pixel còn chip rộng 175 pixel, tức gần một nửa bề ngang.
Ảnh chụp cho thấy chip phủ lên góc trên trái của chính polygon.

Vì sao sai.
`plan.md` mục T8 yêu cầu chip nhỏ một bậc trong media query 900 pixel.
Hiện chip không nhỏ lại.
Section này tồn tại để cho thấy hình dạng khuôn viên, nên che hình bằng chính con số mô tả hình là tự phá mục đích.

Phải làm.
Giảm một bậc cỡ chữ và padding của chip trong `@media (max-width: 900px)`.
Mục tiêu là chip không rộng hơn 45 phần trăm bề ngang khung.

Nghiệm thu.
Ở 390 pixel, chiều rộng chip chia chiều rộng khung nhỏ hơn hoặc bằng 0,45.
Ảnh chụp cho thấy toàn bộ đường viền polygon đọc được, không bị chip cắt.

## 5. Đính chính từ phía tôi

**Con số trong `plan.md` sai.**
Tôi ghi chip sẽ đọc `13.430 m²` và kích thước `141 × 118 m`.
Số đúng là `13.406 m²` và `125 × 156 m`, khớp mốc test 13405,5 đã có từ pha 2.
Antigravity làm đúng, tài liệu của tôi sai.

**R18 là lỗi quy cách của tôi**, đã nêu ở trên.

**Một cáo buộc tôi đã rút.**
Tôi thử commit bằng payload trần và nhận `Dữ liệu KML không hợp lệ`, ban đầu tưởng vòng parse rồi commit bị hỏng.
Kiểm lại thì route chờ bọc `{ data, options }`, và `adminApi.ts` gửi đúng dạng đó, nên luồng trong ứng dụng vẫn chạy.
`plan.md` mô tả body là `ParsedKmlImport` trần, nhưng bọc thêm envelope là lựa chọn hợp lý và không phải lỗi.
Lệnh thử của tôi sai, không phải mã sai.

## 6. Điều kiện nộp lại

Nộp kèm bốn thứ, thiếu một là trả lại ngay.

Một, `git diff --stat`.

Hai, kết quả chạy thật của `npm run build` ở cả hai thư mục và `npm test` ở server, dán nguyên văn.
Số test phải **lớn hơn 71**, vì R13 và R15 đều kiểm được bằng test.

Ba, bằng chứng cho từng mã R13 tới R19 theo đúng số.
Với R13 và R15 phải là phản hồi thật của API dán nguyên văn.
Với R16, R17, R18, R19 phải là ảnh chụp hoặc kết quả `evaluate_script`.

Bốn, danh sách những gì chưa đạt kèm số đo, nếu có.

Trả lại ngay nếu: thiếu bằng chứng cho một mã; bằng chứng là lời khẳng định suông; build hoặc test không sạch; số test không tăng; mở lại một mã đã đóng ở mục 2; làm hỏng một tiêu chí đã nghiệm thu ở mục 3; có dấu gạch dài; đổi giá trị ba hằng marker hoặc sửa vùng `.tour-marker` trong `index.css`; cài lại phép toán hình học đã có sẵn; hoặc ghi vào cơ sở dữ liệu mà không sao lưu trước.

Khi bảy mã này đóng và mục 3 vẫn giữ, tính năng **pass** và sẵn sàng commit.
