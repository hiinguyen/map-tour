# Review lượt 1: kết quả Antigravity nộp cho plan.md

Ngày review: 2026-09-22.
Người review: Claude.
Đối tượng: toàn bộ thay đổi đang nằm trong cây làm việc, chưa commit.

## 0. Phạm vi và cách xác minh

Tôi không đọc được session của Antigravity.
Không có kênh nối hai phiên làm việc, nên mọi kết luận dưới đây dựa trên cây làm việc thật chứ không dựa trên báo cáo của Antigravity.
Đó cũng là cách nghiệm thu đúng, vì thứ được giao là mã nguồn chứ không phải lời kể.

Các lệnh đã chạy và kết quả thật:

```
cd map-tour/server && npm test      -> Test Files 4 passed (4), Tests 64 passed (64)
cd map-tour/server && npm run build -> tsc -p tsconfig.json, không lỗi
cd map-tour && npx tsc -b           -> exit 0
git diff --stat                     -> 22 file sửa, 1849 thêm, 389 xoá
```

Số test tăng từ mốc 57 lên 64 nhờ `kmlParse.test.ts` mới.
Không test nào bị xoá để làm suite xanh, đây là điều kiện cần đầu tiên và nó đã đạt.

## 1. Kết luận

**TRẢ LẠI.**
Task T7 trượt bốn tiêu chí, trong đó có đúng cái lỗi mà T7 sinh ra để sửa.
Các task còn lại đạt hoặc gần đạt.

Không cần làm lại từ đầu.
Phần khung, phần hình học, phần nhập KML đều dùng được.
Việc phải làm là năm điểm sửa ở mục 3 và ba điểm ở mục 4.

## 2. Đã đạt, không được làm lại

Các mục dưới đây đã kiểm bằng chứng cụ thể, Antigravity không cần đụng vào nữa.

Khoá tương tác đúng cách.
`SiteFootprintMap.tsx` dòng 79 đặt `interactive: false` làm option duy nhất, dòng 86 thêm `ScaleControl` với `unit: 'metric'`, dòng 83 đặt `zoomLevelsToOverscale: 6`.

Khung lại khi đổi kích thước đã nối đủ hai đường.
Dòng 93 gắn `map.on('resize', refit)` và dòng 94 gắn `map.once('load', refit)`.
Đường thứ hai là thứ chặn ca mount với chiều cao 0.

Tiếp cận đã có bản text tương đương.
Dòng 244 đặt `aria-hidden` trên container canvas, dòng 258 render `figcaption` thật.

Năm layer paint đã dựng đúng thứ tự trong `src/lib/map/footprints.ts` dòng 83 đến 140.
Layer gạch chéo ở dòng 112 có guard `hasHatch`, nên khi `addImage` thất bại thì hình vẫn còn lớp fill bên dưới và không bao giờ biến mất.

Đỉnh đóng vòng KML có bị bỏ.
`kmlParse.ts` kết thúc `parseCoordinatesText` bằng `openRing(ring)`, tức tái dùng hàm của pha 2 thay vì viết lại phép toán.
Đây là cách làm đúng.

Chuẩn hoá NFC có mặt.
`kmlParse.ts` dòng 28 và dòng 44 đều gọi `.normalize('NFC')`.
Đây là lỗi thầm lặng có xác suất cao nhất trong toàn tính năng và nó đã được chặn.

Khớp không gian đã thay khớp tên.
`kmlParse.ts` dòng 302 đến 370 dựng thang điểm, cho 100 điểm khi điểm nằm trong hình, cộng điểm theo khoảng cách, tên và folder.
Ngưỡng tự tin đặt ở 100, ngưỡng nhập nhằng ở 40.

Bảo vệ bản sửa tay hoạt động.
`kmlCommit.ts` đọc `boundary_source` trước mỗi lần ghi và bỏ qua hàng `admin` trừ khi `overwriteAdminEdits` được bật.
Toàn bộ commit nằm trong một transaction với `ROLLBACK` ở nhánh lỗi.

Đường ghi ranh giới từ admin đúng.
`siteAdmin.ts` dòng 195 đặt `kind = 'area'`, `boundary_source = 'admin'`, `boundary_updated_at = NOW()`.
Dòng 231 xoá ranh giới thì trả `kind = 'point'` và đặt lại hai cột kia về NULL.

Ba hằng marker không đổi giá trị.
`TourMap.tsx` dòng 36, 41, 45 vẫn là 16, 32, 18.

`index.css` chỉ có đúng hai vùng thay đổi, là dòng `@import` mới và khối `.map-popup__area`.
Vùng `.tour-marker` không bị chạm.

`src/lib/geo.ts` frontend chỉ có bốn hàm `footprintOf`, `footprintCenter`, `formatAreaM2`, `circlePolygon`.
Không có `areaSquareMeters`, tức phép toán diện tích không bị nhân bản xuống client.

Vòng tròn dự phòng chỉ vẽ khi có căn cứ.
`SiteFootprintMap.tsx` dòng 42 chỉ tính bán kính khi `estimatedRadiusM` hoặc `surveyedAreaM2` tồn tại và lớn hơn 0.
Đúng quyết định đã chốt là không có số khảo sát thì không bịa vòng.

Nút đã đổi nhãn thành `Xem trong bản đồ làng` và giữ nguyên điều hướng `?site=`.

INSERT site mới đủ cột bắt buộc.
Bảng `sites` chỉ có `village_id`, `kind`, `name`, `category` là NOT NULL không mặc định, và `kmlCommit` truyền đủ cả bốn.

### Hai chỗ tôi nghi là lỗi nhưng không phải

Tra popup ở `TourMap.tsx` dòng 343 vẫn mang tên `areaSites`, khác với chữ trong plan.
Nhưng dòng 321 cấp nguồn feature collection từ **cùng mảng đó**, nên dấu `!` không thể throw.
Antigravity giải bài bằng đường khác đường plan ghi, và kết quả vẫn an toàn.
Không tính là lỗi.

Grep ban đầu của tôi không thấy dấu vết bỏ đỉnh đóng vòng trong `kmlParse.ts`.
Nguyên nhân là Antigravity gọi lại `openRing` chứ không viết logic mới, nên không có chuỗi nào để grep trúng.
Không tính là lỗi.

## 3. Trượt, bắt buộc sửa trước khi pass

### R1. Camera không được nối, T7.1 T7.2 T7.3 trượt

Hiện trạng.
`focusSite` không tồn tại ở bất kỳ đâu trong `src`.
Effect `[selectedId]` ở `TourMap.tsx` dòng 416 đến 438 chỉ toggle class `tour-marker--active` và đổi biểu thức `line-width`.
Lời gọi `fitBounds` duy nhất trong file nằm ở dòng 284, tức lúc dựng bản đồ.
Không có `easeTo`, không có `flyTo`.

Vì sao đây là lỗi chặn.
Đây đúng là bug mà T7 được viết ra để sửa.
Mở `/lang/<slug>/map?site=<id>` vẫn không di chuyển camera, y hệt trước khi làm.
Nút `Xem trong bản đồ làng` vừa được đổi nhãn ở R-khác cũng dẫn tới một trang không phản hồi.

Phải làm.
Cài `focusSite` đúng khối code trong plan.md mục T7, gồm nhánh `fitBounds` cho site có ranh giới và nhánh `easeTo` với `Math.max(map.getZoom(), 17)` cho site điểm.
Đọc `prefers-reduced-motion` để ép `duration = 0`.
Nối deep link bên trong handler `map.on('load')` sẵn có, đọc `selectedIdRef.current`.
Nối các lần chọn sau bằng cách mở rộng effect `[selectedId]` ở dòng 416, chặn đầu bằng `if (!map.isStyleLoaded()) return;`.
Không thêm dep nào vào effect dựng bản đồ.
Cài luôn guard chỉ di khi cần, định nghĩa là bounds nằm hoàn toàn trong viewport thu vào 15 phần trăm và rộng hơn 8 phần trăm bề ngang viewport.

Nghiệm thu.
Mở `?site=20000000-0000-0000-0000-000000000005` thì camera khung đúng vào polygon Khu làng cổ chứ không phải toàn làng.
Mở `?site=20000000-0000-0000-0000-000000000001` thì camera ease tới ghim ở zoom từ 17 và không bao giờ zoom ra.
Bấm một dòng sidebar xa khung hiện tại thì camera di, bấm một ghim đang ở giữa khung thì camera không di.

### R2. Tiêu đề section dùng class không tồn tại, lỗi hiển thị thật

Hiện trạng.
`SiteFootprintMap.tsx` dòng 233 là `<h3 className="landmark__section-title">Quy mô khuôn viên</h3>`.
Class `landmark__section-title` **không có trong bất kỳ file CSS nào** của dự án.
Mọi section khác trong trang chi tiết dùng `<h2>` và được style qua `.landmark__section-head h2` ở `landmark.css` dòng 207.

Vì sao đây là lỗi.
Tiêu đề sẽ hiện ra bằng kiểu h3 mặc định của trình duyệt, khác hẳn font, cỡ và màu của mọi tiêu đề còn lại trên cùng trang.
Ngoài ra một `h3` xen giữa một loạt `h2` ngang cấp làm gãy thứ bậc heading, gây khó cho trình đọc màn hình.

Phải làm.
Đổi sang đúng cấu trúc mà các section khác đang dùng:

```tsx
<section className="landmark__section">
  <div className="landmark__section-head">
    <h2>Quy mô khuôn viên</h2>
    <p className="landmark__section-lead">…</p>
  </div>
  <figure className="footprint-map">…</figure>
</section>
```

Nghiệm thu.
Chụp màn hình trang chi tiết, tiêu đề `Quy mô khuôn viên` phải trông giống hệt tiêu đề `Giới thiệu` ngay dưới nó về font, cỡ, màu và khoảng cách.
Không còn chuỗi `landmark__section-title` trong mã nguồn.

### R3. Chuyển giao marker theo từng site không có, T7.10 trượt

Hiện trạng.
`TourMap.tsx` dòng 365 vẫn là `const compact = map.getZoom() < MARKER_LABEL_MIN_ZOOM`.
Đây là một boolean toàn cục tính từ zoom, đúng như code cũ.

Phải làm.
Đổi sang predicate theo từng site:

```
compact(site) = hasFootprint(site)
  ? projectedSpanPx(site) < MARKER_BADGE_SIZE * 1.5
  : map.getZoom() < MARKER_LABEL_MIN_ZOOM
```

`projectedSpanPx` là `min(width, height)` của bounds ranh giới sau `map.project()`, tính trong cùng lượt với `resolveMarkerLayout`.
Ba hằng marker giữ nguyên giá trị, task này chỉ đổi **khi nào** một class được áp.
Thêm một dòng comment ở cụm hằng ghi rằng việc thu gọn giờ còn phụ thuộc span ranh giới đã project.

Nghiệm thu.
Zoom ra xa trên `/map`, marker của một ranh giới nhỏ thu về chấm 18px, còn marker của một ranh giới lớn vẫn giữ badge 32px và nhãn.

### R4. Marker vẫn neo vào `siteCenter` thay vì trọng tâm ranh giới

Hiện trạng.
`TourMap.tsx` dòng 357 đặt `.setLngLat(toLngLat(siteCenter(site)))`.
Không có lời gọi `footprintCenter` nào trong file.

Vì sao đây là lỗi.
Với một site `point` vừa nhận ranh giới từ KML, `position` là ghim gốc chứ không phải trọng tâm thửa.
Badge có thể rơi ra ngoài chính cái hình mà nó đánh dấu.
Với hai site seed thì hai giá trị trùng nhau, nên lỗi này chỉ lộ ra sau khi nhập KML, tức đúng lúc khó phát hiện nhất.

Phải làm.
Marker neo tại `footprintCenter(site)`.
**Định tuyến giữ nguyên `siteCenter`** ở `MapPage.tsx` dòng 37 và ở lời gọi tuyến tham quan `TourMap.tsx` dòng 381.
Một tuyến đường phải bắt đầu ở ghim đã ghi, thường là cổng, chứ không phải giữa toà nhà.

Nghiệm thu.
Sau khi nhập KML, mọi badge nằm trong hình của chính nó.
Chọn hai site rồi dùng chỉ đường, tuyến vẫn bắt đầu ở ghim đã ghi.

### R5. `TourMap` không đi qua accessor `footprintOf`

Hiện trạng.
`TourMap.tsx` dòng 302 lọc inline `site.kind === 'area' && site.boundary && site.boundary.length >= 3`.
`footprintOf` được import ở `SiteList.tsx` và `MapPage.tsx` nhưng không ở `TourMap.tsx`.

Vì sao đây là lỗi.
Hôm nay biểu thức này tương đương `footprintOf` nhờ ràng buộc `chk_sites_geometry` của migration 015.
Nhưng plan quy định mọi chỗ đọc ranh giới đi qua **một** accessor, để có đúng một điểm guard cho dữ liệu KML lỗi.
Giữ hai bản cài đặt nghĩa là ngày constraint đổi thì hai chỗ lệch nhau âm thầm.

Phải làm.
Thay biểu thức lọc bằng `sites.filter((site) => footprintOf(site) !== null)` và đổi tên biến thành `footprintSites`.

Nghiệm thu.
Không còn biểu thức nào đọc `site.boundary` trực tiếp trong `TourMap.tsx`.

## 4. Mức trung bình, sửa luôn trong lượt này

### R6. `kmlCommit` không kiểm định lại vòng trước khi ghi

`kmlCommit.ts` ghi thẳng `item.ring` lấy từ body của client vào cột `boundary`.
Bước preview có gọi `validateRing`, nhưng payload đi qua tay người sửa giữa hai bước.
Một vụ đảo lat/lng sinh ra trong lúc sửa tay sẽ vào thẳng cơ sở dữ liệu mà không ai kêu.

Phải gọi `validateRing` một lần nữa ngay trước mỗi `UPDATE` và mỗi `INSERT`, và để một vòng lỗi làm hỏng cả transaction kèm thông báo nêu rõ dòng nào.

### R7. Tạo site mới chưa chắc idempotent

`kmlCommit.ts` sinh `randomUUID()` mỗi lần chạy cho mỗi placemark có `createNewSite`.
Nạp lại cùng một file chỉ không tạo trùng nếu lượt sau khớp không gian bắt được site vừa tạo.
Điều đó đúng với polygon lồi, vì trọng tâm nằm trong hình, nhưng hụt với polygon lõm khi trọng tâm rơi ra ngoài.

Phải chặn bằng một kiểm tra trước khi INSERT, ví dụ từ chối tạo mới khi đã có site cùng làng nằm trong chính vòng đó, và báo cáo nó như một khớp thay vì một dòng chưa khớp.

### R8. Category mặc định `Khác` không có trong bảng style

`kmlCommit.ts` dùng `'Khác'` làm category dự phòng khi tạo site mới.
Chuỗi này không có trong `siteCategories.ts` nên site mới rơi vào `FALLBACK_STYLE`.
Chọn một giá trị đã có trong bảng, hoặc bổ sung `Khác` vào `CATEGORY_STYLES` kèm icon riêng.

## 5. Chưa xác minh được trong lượt này

Các tiêu chí sau cần Postgres và dev server chạy thật, tôi chưa dựng lên nên chúng **chưa được nghiệm thu**, không phải đã đạt.

Cuộn chuột trên bản đồ khoá thì trang phải cuộn.
`document.querySelector('.maplibregl-canvas').tabIndex === -1`.
Tab phải bỏ qua canvas.
Ở bề rộng 390 pixel, chip và thước tỉ lệ không chồng nhau và ranh giới vẫn được khung lại chứ không bị cắt.
`vietnam.pmtiles` trả `206 Partial Content` chứ không GET toàn file.
Đo đường kính vòng tròn dự phòng bằng thước tỉ lệ phải khớp `2r`.
Nạp lại cùng file KML lần hai để xác nhận idempotent và xác nhận dòng đã sửa tay được báo là được bảo vệ.

Antigravity phải chạy và dán bằng chứng cho từng dòng trên khi nộp lại.

## 6. Điều kiện nộp lại

Nộp kèm bốn thứ, thiếu một là trả lại ngay mà không đọc tiếp.

Một, `git diff --stat`.

Hai, kết quả chạy thật của `npm run build` ở cả hai thư mục và `npm test` ở server, dán nguyên văn.
Số test phải từ 64 trở lên.
Mỗi điểm sửa ở mục 3 và 4 mà kiểm được bằng hàm thuần thì phải có thêm test, không được sửa xong mà suite đứng yên.

Ba, bằng chứng cho từng mã R1 đến R8 theo đúng số, và cho từng dòng ở mục 5.
Bằng chứng là kết quả chạy hoặc ảnh chụp màn hình, không phải lời khẳng định.

Bốn, danh sách những gì chưa đạt kèm số đo, nếu có.

Trả lại ngay nếu: thiếu bằng chứng cho một mã; bằng chứng là lời khẳng định suông; build hoặc test không sạch; số test tụt xuống dưới 64; tự nới tiêu chí mà không báo; có dấu gạch dài trong tài liệu; đổi giá trị ba hằng marker hoặc sửa vùng `.tour-marker` trong `index.css`; cài lại phép toán hình học ở frontend; hoặc đổi lược đồ cơ sở dữ liệu mà không backup trước.
