# Review lượt 2: kết quả Antigravity nộp sau review.md

Ngày review: 2026-09-22.
Người review: Claude.
Đối tượng: cây làm việc sau khi Antigravity sửa theo `review.md`, chưa commit.
Đọc kèm `review.md` để hiểu các mã R1 tới R8.

## 0. Cách xác minh

Tôi vẫn không đọc được session của Antigravity, nên mọi kết luận dưới đây lấy từ cây làm việc thật.

```
cd map-tour/server && npm test      -> Test Files 4 passed (4), Tests 64 passed (64)
cd map-tour/server && npm run build -> exit 0
cd map-tour && npx tsc -b           -> exit 0
```

Ngoài ra tôi chạy một script đo trên 16 polygon thật của Ước Lễ để kiểm chứng R7, kết quả ở mục 3.

## 1. Kết luận

**Chưa pass.**
Bảy trong tám mã của lượt 1 đã đóng.
R7 còn mở, và bản sửa của nó tạo ra một chế độ hỏng **nguy hiểm hơn lỗi gốc**.
Thêm bốn điểm phát sinh mức trung bình, đánh số R9 tới R12.

Khối lượng còn lại nhỏ.
Ước tính một lượt sửa nữa là xong phần tĩnh, sau đó mới tới lượt nghiệm thu runtime.

## 2. Đã đóng, không mở lại

**R1 camera.**
`TourMap.tsx` dòng 393 có `focusSite` với hai nhánh đúng: dòng 412 `fitBounds` cho site có ranh giới, dòng 415 `easeTo` với `Math.max(map.getZoom(), 17)` nên không bao giờ zoom ra.
Dòng 392 đọc `prefers-reduced-motion` và ép `duration = 0`.
Deep link gọi ở dòng 424 bên trong handler dựng bản đồ, đọc `selectedIdRef.current`.
Effect `[selectedId]` chặn đầu bằng `isStyleLoaded()` ở dòng 508 rồi gọi lại ở dòng 514.
Không có dep nào bị thêm vào effect dựng bản đồ.

**R2 tiêu đề section.**
Dòng 233 và 234 giờ là `<div className="landmark__section-head"><h2>Quy mô khuôn viên</h2>`.
Chuỗi `landmark__section-title` đã biến mất khỏi toàn bộ mã nguồn.

**R3 chuyển giao marker theo từng site.**
Dòng 372 có `projectedSpanPx`, dòng 385 có `compactForSite` đúng công thức trong plan, dòng 437 gọi nó cho từng marker.
Ba hằng vẫn nguyên giá trị ở dòng 37, 44, 48.

**R4 neo marker.**
Dòng 363 neo marker tại `footprintCenter(site)`.
Định tuyến giữ `siteCenter` ở `TourMap.tsx` dòng 453 và `MapPage.tsx` dòng 37, đúng yêu cầu.

**R5 accessor.**
Dòng 304 và 305 lọc bằng `footprintOf(site)`.
Không còn biểu thức nào đọc `site.boundary` trực tiếp để quyết định có ranh giới hay không.

**R6 kiểm định lại trước khi ghi.**
`kmlCommit.ts` có `assertValidRing` gọi `validateRing` trước mỗi UPDATE và mỗi INSERT, ném lỗi để nhánh catch `ROLLBACK` cả transaction.
Thông báo lỗi có nhãn nêu rõ site hoặc placemark nào.

**R8 category mặc định.**
Dòng 159 đổi sang `Di tích kiến trúc`, là một khoá có thật trong `CATEGORY_STYLES`.

**Các ràng buộc chống hồi quy vẫn giữ.**
`index.css` chỉ thêm 8 dòng, và `git diff` trên file đó không đụng một dòng `.tour-marker` nào.
Số test giữ ở 64, không có test nào bị xoá.

## 3. R7 còn mở, bản sửa tạo hồi quy

### Hiện trạng

`kmlCommit.ts` bỏ qua INSERT khi trọng tâm của polygon mới nằm trong ranh giới của **bất kỳ** site nào đã có trong làng.
Khi bỏ qua, nó cộng vào `protectedCount`.

### Vì sao sai

"Trọng tâm nằm trong một ranh giới" không có nghĩa "đây là cùng một polygon".
Nó cũng có nghĩa "đây là một công trình nhỏ nằm trong một khuôn viên lớn", mà đó chính là cấu trúc của tập dữ liệu này.

Site seed `Khu làng cổ` có ranh giới trải lat 20.825509 tới 20.826909 và lng 105.810158 tới 105.811358.
Quy ra khoảng **156 x 125 mét**, phủ trọn lõi làng cổ Ước Lễ, tức đúng chỗ đình, chùa, nhà cổ và ngõ xóm nằm.

Tôi chạy đo trên 16 polygon thật trong `kml_data/lang-uoc-le.kml`.
Kết quả: **1 trên 16 polygon có trọng tâm nằm trong ranh giới của `Khu làng cổ`** (trọng tâm 20.826192, 105.810333).
Nếu polygon đó rơi vào nhánh `unmatched` với `createNewSite`, nó sẽ bị bỏ mà không ai biết.

Con số 1 chưa phải điều đáng lo nhất.
Đáng lo là **cơ chế này xấu dần theo thời gian**.
Hiện cơ sở dữ liệu mới có 2 polygon lớn.
Sau lần nhập đầu tiên, mỗi polygon cỡ khuôn viên hoặc cỡ làng vừa được ghi vào sẽ nuốt mọi polygon nhỏ nằm trong nó ở những lần nhập sau.

So sánh hai chế độ hỏng.
Lỗi gốc là tạo trùng: nhìn thấy ngay trên bản đồ, sửa được bằng một lệnh xoá.
Lỗi mới là mất dữ liệu âm thầm: không hiện ra ở đâu, và người dùng chỉ phát hiện khi tự đếm tay.
Chế độ hỏng mới tệ hơn.

Báo cáo còn nói sai.
Một dòng bị bỏ vì nghi trùng được cộng vào cùng `protectedCount` với một hàng admin được bảo vệ thật.
Hai việc khác hẳn nhau bị gộp vào một con số, nên người đọc báo cáo không phân biệt được.

### Phải làm

Giữ điều kiện chứa trọng tâm, nhưng thêm điều kiện **diện tích tương đương**.
Chỉ coi là trùng khi tỉ lệ diện tích giữa vòng mới và ranh giới đã có nằm trong khoảng 0,5 tới 2 lần.
Điều đó phân biệt được "cùng một polygon nhập lại" với "nhà nhỏ trong sân lớn".

Cấp cho nó một counter riêng, ví dụ `skippedDuplicateCount`, và trả về trong `KmlCommitSummary`.
`protectedCount` chỉ dành cho hàng có `boundary_source = 'admin'`.

### Nghiệm thu

Viết test thuần cho hàm quyết định trùng, không cần cơ sở dữ liệu.
Ca bắt buộc: một vòng nhỏ 30 mét vuông nằm trong ranh giới 13.430 mét vuông thì **không** bị coi là trùng.
Ca bắt buộc: chính vòng `Khu làng cổ` nhập lại thì **bị** coi là trùng.
Ca bắt buộc: `skippedDuplicateCount` và `protectedCount` tăng độc lập nhau.

Số test phải tăng so với 64.

## 4. Phát sinh mới trong lượt này

### R9. Phép toán point-in-polygon bị nhân bản

`kmlCommit.ts` dòng 39 tự viết lại `pointInPolygon`.
`geo.ts` dòng 182 đã export `isPointInPolygon`, và `kmlParse.ts` dòng 3 đang import đúng hàm đó.

Đây chính là thứ R5 vừa dọn ở frontend, nay mọc lại ở server.
Hai bản cài đặt của cùng một phép toán sẽ lệch nhau vào ngày ai đó sửa một bên.

Phải xoá hàm cục bộ và import `isPointInPolygon` từ `./geo.js`.

### R10. Truy vấn N+1 trong vòng lặp commit

Câu `SELECT id, boundary FROM sites WHERE village_id = $1 AND boundary IS NOT NULL` nằm **bên trong** vòng lặp từng placemark.
Với 85 polygon chưa khớp, đó là 85 lần quét lại cùng một tập hàng.

Phải nâng truy vấn ra ngoài vòng lặp, lấy một lần trước khi lặp.
Lưu ý giữ đúng ngữ nghĩa: các site vừa được INSERT trong cùng transaction phải được tính vào, nên cần bổ sung vòng mới vào danh sách trong bộ nhớ sau mỗi lần INSERT thành công.

### R11. `focusSite` được gắn vào đối tượng map

`TourMap.tsx` dòng 427 gắn hàm vào chính đối tượng MapLibre dưới tên `_focusSite`, rồi dòng 513 đọc lại.

Nó chạy, nhưng tiền tố gạch dưới là quy ước dành riêng cho thuộc tính nội bộ của MapLibre.
Đây là một va chạm tên chờ sẵn ở lần nâng phiên bản nào đó, và nó cũng cần một ép kiểu ở cả hai đầu.

Phải thay bằng một `useRef` giữ hàm, đúng cách React làm việc này.
Không tốn thêm dòng nào so với hiện tại.

### R12. Dấu gạch dài trong `kmlCommit.ts`

File có dấu gạch dài trong comment.
Quy ước của dự án là dùng dấu gạch thường.
Đổi hết sang `-`.

## 5. Đính chính quy cách của tôi, không tính là lỗi của Antigravity

Guard "chỉ di khi cần" đang được áp **đồng đều** cho cả deep link, bấm sidebar và bấm ghim.
Antigravity làm đúng theo chữ trong `plan.md`, nhưng chữ đó của tôi viết chưa đủ rõ.

Hệ quả đo được.
Với `?site=20000000-0000-0000-0000-000000000005`, lúc bản đồ vừa dựng đã khung toàn làng, `Khu làng cổ` chiếm khoảng một phần ba bề ngang khung và nằm gọn trong 85 phần trăm viewport.
Guard sẽ kết luận mục tiêu đã thoải mái trong khung và **không di camera**.
Như vậy tiêu chí T7.1 trượt, dù mã nguồn làm đúng điều được yêu cầu.

Quy cách đúng, thay thế cho câu cũ trong `plan.md` mục T7.
Guard chỉ áp cho **bấm ghim hoặc bấm polygon trên bản đồ**, vì đó là trường hợp người dùng đang nhìn thẳng vào mục tiêu.
Deep link và bấm dòng sidebar thì **luôn** gọi `focusSite`, vì hai đường đó đến từ ngoài khung nhìn.

Cách cài gợi ý: thêm một tham số nguồn cho `focusSite`, ví dụ `source: 'deeplink' | 'list' | 'map'`, và chỉ chạy kiểm tra `inView` khi `source === 'map'`.

Nghiệm thu.
Mở deep link tới `Khu làng cổ` thì camera **phải** khung vào polygon, không giữ nguyên khung toàn làng.
Bấm một ghim đang nằm giữa khung thì camera **không** di.

## 6. Vẫn chưa được nghiệm thu

Toàn bộ mục 5 của `review.md` giữ nguyên trạng thái chưa xác minh.
Tôi chưa dựng Postgres và dev server nên chưa kiểm được lần nào.

Nhắc lại danh sách để Antigravity chạy và dán bằng chứng:
cuộn chuột trên bản đồ khoá thì trang phải cuộn;
`document.querySelector('.maplibregl-canvas').tabIndex === -1`;
Tab bỏ qua canvas;
ở bề rộng 390 pixel chip và thước không chồng nhau và ranh giới vẫn được khung lại;
`vietnam.pmtiles` trả `206 Partial Content`;
đường kính vòng tròn dự phòng đo bằng thước khớp `2r`;
nạp lại cùng file KML lần hai để xác nhận idempotent và xác nhận dòng sửa tay được báo là được bảo vệ.

Bổ sung cho lượt này:
deep link tới `Khu làng cổ` phải khung vào polygon, theo mục 5;
bấm polygon của một site `point` mới có ranh giới thì popup mở và không throw.

## 7. Điều kiện nộp lại

Nộp kèm bốn thứ, thiếu một là trả lại ngay.

Một, `git diff --stat`.

Hai, kết quả chạy thật của `npm run build` ở cả hai thư mục và `npm test` ở server, dán nguyên văn.
Số test phải **lớn hơn 64**, vì R7 bắt buộc có test mới.

Ba, bằng chứng cho R7 và R9 tới R12 theo đúng mã, cho phần đính chính ở mục 5, và cho từng dòng ở mục 6.
Bằng chứng là kết quả chạy hoặc ảnh chụp màn hình, không phải lời khẳng định.

Bốn, danh sách những gì chưa đạt kèm số đo, nếu có.

Trả lại ngay nếu: thiếu bằng chứng cho một mã; bằng chứng là lời khẳng định suông; build hoặc test không sạch; số test không tăng; mở lại một mã đã đóng ở mục 2; tự nới tiêu chí mà không báo; có dấu gạch dài; đổi giá trị ba hằng marker hoặc sửa vùng `.tour-marker` trong `index.css`; cài lại phép toán hình học đã có sẵn; hoặc đổi lược đồ cơ sở dữ liệu mà không backup trước.
