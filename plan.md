# Bản giao việc: thiết kế lại bản đồ để thể hiện hình dáng và diện tích khu vực

Tài liệu này giao việc cho agent thực thi (Antigravity).
Người viết tài liệu giữ vai trò giao việc và nghiệm thu, không trực tiếp code các task dưới đây.
Mỗi task có tiêu chí nghiệm thu riêng.
Task chỉ được coi là xong khi toàn bộ tiêu chí của nó đạt.

## 1. Vấn đề cần giải quyết

Bản đồ hiện tại không truyền tải được độ rộng của một địa điểm.
Nhà thờ, sân đình, chùa là những nơi có khuôn viên lớn, nhưng trên bản đồ chỉ hiện ra một cái ghim tròn 32px giống hệt cái ghim của một cái giếng.
Ghim không nói lên điều gì về diện tích.

Kết quả mong muốn gồm hai phần.
Thứ nhất, mỗi địa danh có một mặt bằng khoá cứng (không cho zoom, không cho kéo) hiển thị đúng hình dáng khuôn viên, kèm thước tỉ lệ và diện tích m².
Thứ hai, bản đồ tổng quan cả làng tại `/map` cũng phải thể hiện được các khuôn viên đó.

## 2. Quy tắc bắt buộc khi thực thi

Không dùng dấu gạch dài trong mọi văn bản sinh ra, kể cả comment và chuỗi hiển thị.
Dùng dấu gạch thường thay thế.

Khi viết hoặc sửa nhiều file Markdown, đặt mỗi câu trên một dòng riêng.

Khi ra quyết định kỹ thuật, không coi trọng chi phí phát triển.
Ưu tiên chất lượng, tính đơn giản, độ bền, khả năng mở rộng và khả năng bảo trì dài hạn.

Khi sửa lỗi, luôn bắt đầu bằng việc tái hiện lỗi trong môi trường end-to-end gần nhất với cách người dùng thật gặp nó.
Việc đó bảo đảm tìm ra đúng nguyên nhân thật.

Khi kiểm thử end-to-end, phải khắt khe với giao diện nhìn thấy.
Nếu có gì rõ ràng trông sai, kể cả không liên quan tới task đang làm, vẫn phải sửa.
Áp dụng cùng tiêu chuẩn đó cho lint, test lỗi và test chập chờn.

Không được tự nới lỏng tiêu chí nghiệm thu.
Nếu một tiêu chí không đạt được, báo lại kèm lý do và số đo cụ thể, không im lặng bỏ qua.

Mọi thay đổi lược đồ cơ sở dữ liệu phải chạy `bash scripts/backup.sh` trước.
Mọi migration phải dry-run trong một transaction rồi `ROLLBACK` trước khi áp thật.

## 3. Trạng thái hiện tại

Phần dữ liệu nền và thư viện hình học đã hoàn thiện và đã nghiệm thu.
Không được sửa lại các quyết định dưới đây mà không nêu lý do bằng số đo.

### 3.1 Đã hoàn thành: lược đồ cơ sở dữ liệu

File `migrations/015_sites_position_and_footprint.sql` đã được áp vào cơ sở dữ liệu đang chạy.
Bản backup trước khi áp nằm ở `backups/lang_uoc_le_20260922-092100.sql.gz`.

Bất biến mới của bảng `sites`:

- Mọi site đều có toạ độ điểm, vì `position_lat` và `position_lng` giờ là `NOT NULL`.
- `boundary` là tuỳ chọn, lưu dạng `[[lat,lng],...]`, vòng MỞ nghĩa là đỉnh đầu không lặp lại ở cuối.
- `kind = 'area'` khi và chỉ khi `boundary IS NOT NULL`, do ràng buộc `chk_sites_geometry` cưỡng chế.
- Hai cột mới là `boundary_source` nhận `'seed'`, `'kml'` hoặc `'admin'`, cùng `boundary_updated_at`.

Ràng buộc `chk_sites_geometry` là mục đích duy nhất của việc giữ cột `kind`.
Nó biến việc quên cập nhật `kind` thành lỗi ồn ào thay vì dữ liệu sai âm thầm.
Không được bỏ ràng buộc này vì tiện.

Cột `boundary_source` tồn tại để lần nhập KML sau không ghi đè bản đã sửa tay trong trang quản trị.

Trạng thái dữ liệu hiện tại: 130 site `point` và 2 site `area`.
Hai site `area` đã được backfill toạ độ bằng chính trọng tâm mà `TourMap.tsx` đang vẽ marker, nên hiển thị không thay đổi.

### 3.2 Đã hoàn thành: thư viện hình học server

Ba module thuần trong `map-tour/server/src/lib/`, không import `pg` hay `env`, nên test được mà không cần cơ sở dữ liệu.

`geo.ts` là bản chính duy nhất của các phép toán hình học:

```
type LatLng = [number, number]            // [lat, lng]
interface Bounds { south, west, north, east }
interface Span { width, height }          // mét
MIN_RING_VERTICES = 3
areaSquareMeters(ring): number            // luôn dương
boundsOf(ring): Bounds
spanMeters(ring): Span
polygonCentroid(ring): LatLng
estimatedRadiusMeters(landAreaM2): number | null
normalizeWinding(ring): LatLng[]          // về ngược kim đồng hồ
```

`boundaryValidate.ts` kiểm định một vòng trước khi ghi:

```
openRing(ring): LatLng[]                  // bỏ đỉnh đóng và đỉnh trùng liên tiếp
villageBoundsFrom(points): Bounds         // hộp bao làng đã nới
isSelfIntersecting(ring): boolean
validateRing(ring, { villageBounds, landAreaM2? }): { ring, areaM2, centroid, errors, warnings }
```

`validateRing` không bao giờ throw.
Nó trả về `errors` và `warnings` để bước xem trước hiện được mọi vấn đề của mọi placemark trong một lần.

`boundaryInput.ts` đọc toạ độ người dùng dán vào trang quản trị:

```
parseBoundaryInput(raw): { ring, format, errors }
formatBoundaryInput(ring): string
```

Nó nhận ba định dạng, phân biệt bằng ký tự đầu tiên:

| Ký tự đầu | Hiểu là | Thứ tự trục |
|---|---|---|
| `{` | GeoJSON Polygon, Feature, hoặc FeatureCollection một feature | lng,lat |
| `[` | Định dạng của app, để giá trị prefill round-trip được | lat,lng |
| khác | Khối `<coordinates>` dán thẳng từ file KML | lng,lat |

Hạ tầng test: `map-tour/server/vitest.config.ts`, script `npm test` và `npm run test:watch`, và `tsconfig.json` đã có `"exclude": ["src/**/*.test.ts"]` để test không lọt vào bản build.

Hiện có **57 test xanh** trong 3 file.
Bộ test đã được kiểm bằng cách đột biến mã nguồn bốn lần (đổi bán kính Trái Đất, bỏ `Math.abs`, đảo lat/lng trong trọng tâm, bỏ chuẩn hoá chiều quay).
Cả bốn đột biến đều bị test bắt.

Toàn bộ 136 polygon thật trong 6 file KML của người dùng đã được chạy qua `validateRing`.
Kết quả: 136 đậu, 0 từ chối, 0 cảnh báo.

## 4. Dữ liệu thật đã đo, không cần suy luận lại

Các số dưới đây đã được đo trực tiếp.
Không được đoán lại hay thay bằng phỏng đoán.

### 4.1 Nguồn KML

File `map.txt` ở gốc repo chứa 6 link Google My Maps.
Tải KML của một map bằng lệnh sau, không cần đăng nhập vì map đã chia sẻ link:

```
curl -sSL "https://www.google.com/maps/d/kml?mid=<MID>&forcekml=1" -o map.kml
```

`<MID>` là giá trị tham số `mid` trong link.
Lưu ý `map.txt` không có ký tự newline ở dòng cuối, nên vòng `while read` của shell sẽ bỏ mất link thứ 6.

Ánh xạ map sang làng, xác định bằng toạ độ `ll` trong link:

| mid | Tên trong KML | village slug | Polygon |
|---|---|---|---|
| `13FSQD2lPI0gV7S6P9Xke9Hr6VUZPdeA` | Làng Cự Đà | `cu-da` | 21 |
| `1do69PTSksCVnOOGXy3hF1dvlyvnBwZE` | làng Hạ Thái | `ha-thai` | 14 |
| `1xsxEnnvud2r8UBDKxIEABDUvwFMm1hY` | My Map làng Chuông- Thanh Oai | `lang-chuong` | 21 |
| `1Cc3CIWOL9V8KURDa5YhA_5gT_Rramu0` | My Map Làng Cựu | `lang-cuu` | 55 |
| `1xHfNYeAgUeXDI4Sof9d3GT669B_PDXY` | Phú Vinh | `phu-vinh` | 9 |
| `1FSfpZVwnCOeQQ77lkjT_zfsOGrOTNps` | Làng Ước Lễ | `lang-uoc-le` | 16 |

Tổng 136 polygon.

### 4.2 Cấu trúc KML thật

Không có `MultiGeometry` và không có `innerBoundaryIs` ở bất kỳ map nào trong cả 6 map.
Nghĩa là toàn vòng đơn giản, nên định dạng lưu một vòng `[[lat,lng],...]` là đủ và không cần migration thứ hai.

Giữa `<LinearRing>` và `<coordinates>` có thẻ `<tessellate>1</tessellate>` chen vào.
Regex dạng `<LinearRing>\s*<coordinates>` sẽ không khớp gì cả.
Nên dùng bộ phân tích XML thật thay vì regex.

Khối `<coordinates>` thật có dạng sau, với thụt lề 16 dấu cách, thành phần độ cao `,0`, và đỉnh đầu lặp lại ở cuối:

```
                105.8100688,20.8275851,0
                105.8099682,20.8274949,0
                ...
                105.8100688,20.8275851,0
```

Ngoài polygon, các map còn chứa nhiều `LineString` (đường làng) và `Point` (ghim).
Số `LineString` lên tới 188 trong một map.
Chúng không phải ranh giới địa danh và phải bị loại khỏi báo cáo nhập ranh giới, không được liệt kê thành 188 dòng gây nhiễu.

### 4.3 Tên folder và tên polygon

Sáu map chia thành hai kiểu tổ chức khác nhau.

Kiểu generic gồm `cu-da`, `ha-thai`, `lang-uoc-le`.
Folder tên `Khoanh vùng`, `khoanh vùng`, `Khoang vùng`, `đánh dấu`, `điểm`, `đường`.
Tên folder ở kiểu này không mang thông tin category.

Kiểu semantic gồm `lang-chuong`, `lang-cuu`, `phu-vinh`.
Folder tên theo loại công trình, nên dùng được làm category.
Bảng ánh xạ sang chuỗi `category` thật đang có trong cơ sở dữ liệu:

| Tên folder trong KML | category trong cơ sở dữ liệu |
|---|---|
| `Công trình tâm linh`, `công trình tâm linh` | `Di tích tín ngưỡng` |
| `Nhà Cổ`, `Nhà cổ` | `Nhà cổ` |
| `Mặt Nước`, `Mặt nước` | `Mặt nước` |
| `Công trình công cộng` | `Công trình công cộng` |
| `Công trình văn hóa` | `Công trình công cộng` |
| `Không Gian Có Giá Trị`, `Không gian có giá trị`, `Công trình có giá trị` | `Cảnh quan` |
| `Cảnh quan` | `Cảnh quan` |
| `Cây Cổ Thụ` | `Cây` |
| `Nhà làm nghề truyền thống` | `Làng nghề` |

### 4.4 Tên polygon không dùng được để khớp

Đây là kết luận quan trọng nhất về dữ liệu.
Khớp theo tên gần như không ra kết quả nào.

Tên thật trong KML gồm: `Đa giác 11`, `Đa giác 82` đến `Đa giác 89` là tên tự sinh của Google; `Nhà cổ` lặp 18 lần trong Làng Cựu; `phơi miến` lặp 8 lần trong Cự Đà; `ranh giới đền ông`, `ranh chùa`, `ranh đình`, `rảnh điếm` có tiền tố chỉ ranh giới; `ranh giớ nhà thờ` sai chính tả.

Số đo cụ thể khi đối chiếu 136 polygon với 130 site có toạ độ:

| Cách khớp | Kết quả |
|---|---|
| Điểm trong hình, đúng một ghim | 40 trên 136 |
| Điểm trong hình, không ghim nào | 86 trên 136 |
| Điểm trong hình, nhiều ghim | 10 trên 136 |
| Bộ khớp kết hợp, tự tin | 51 trên 136 |
| Bộ khớp kết hợp, yếu | 53 trên 136 |
| Bộ khớp kết hợp, không khớp | 32 trên 136 |

Bộ khớp kết hợp cho ra 50 trên 130 site có ranh giới, phân bố 8 đến 12 site mỗi làng, phủ cả 6 làng.
So với 2 site hiện tại thì đây là mức đủ để tính năng có ý nghĩa.

86 polygon không chứa ghim nào phần lớn là những chỗ chưa hề có trong cơ sở dữ liệu.
Ví dụ: 8 sân `phơi miến` ở Cự Đà cách site gần nhất 226 đến 581 mét; các nhà nghệ nhân ở Hạ Thái; 48 polygon `Nhà cổ` ở Làng Cựu trong khi cơ sở dữ liệu chỉ có 2 site nhà ở tại đó.
Nghĩa là file KML giàu hơn cơ sở dữ liệu.

### 4.5 Hiệu chuẩn ngưỡng kiểm định

Ngưỡng nới hộp bao làng là 1500 mét, không phải 500 mét.
Lý do: hộp bao lõi làng Ước Lễ chỉ 457 nhân 355 mét, nhưng Chùa Sổ là di tích có trong bảng `heritage_buildings` lại nằm 547 mét phía nam.
Ngưỡng 500 mét từ chối oan đúng hình đó.
Cặp làng gần nhau nhất là Làng Chuông và Ước Lễ cách 5,0 km, nên với 1500 mét nới thì hai hộp bao đã nới vẫn cách nhau khoảng 2 km và việc gán sai làng vẫn bị bắt với biên độ rất rộng.

Ngưỡng cảnh báo diện tích nhỏ là 10 m², không phải 50 m².
Lý do: ngưỡng 50 m² kêu oan 11 lần với kích thước bình thường, gồm nhà cổ Làng Cựu 18 đến 50 m², `miếu trình` 30 m², `nhà thờ họ` 44 m², `Đền ngõ họ` 39 m².
Nhà truyền thống 5 nhân 6 mét đúng bằng 30 m², nên đó là kích thước bình thường.
Một hình bấm lỡ tay thì chỉ vài m².

### 4.6 Bẫy khi viết test hình học

Khi dựng một hình vuông n nhân n mét để kiểm `areaSquareMeters`, bắt buộc đổi mét sang độ bằng `R * pi / 180` với `R = 6371008.8`, tức 111195,08 mét trên một độ.
Dùng con số 111320 mét trên một độ quen thuộc sẽ cho hình vuông nhỏ hơn 0,112% mỗi chiều, tức diện tích lệch 0,224%.
Khi đó test đỏ vì hình thử sai, không phải vì hàm sai.

Mốc số liệu đúng: hình vuông 100 nhân 100 mét ở vĩ độ 20,83 cho 9999,970 m².
Hai vòng seed trong `migrations/004_seed_sites.sql` cho 13405,5 m² và 7107,3 m².
Cả hai vòng seed đều theo chiều kim đồng hồ.

## 5. Các task cần làm

Thứ tự dưới đây là bắt buộc.
Mỗi task phải để lại ứng dụng ở trạng thái chạy được.
Không được gộp nhiều task vào một lần thay đổi lớn.

### T1. Gộp type và mở rộng API đọc

Đây là mối nối giữa phần server và phần frontend, nên làm trước mọi việc hiển thị.

Sửa `map-tour/src/types.ts`.
Xoá hai interface `PointSite` và `AreaSite`, thay bằng một `TourSite` duy nhất:

```ts
export interface TourSite extends BaseSite {
  kind: 'point' | 'area';
  position: LatLng;
  boundary?: LatLng[];
  areaM2?: number;
  spanM?: { width: number; height: number };
  estimatedRadiusM?: number | null;
  landAreaM2?: number | null;
}
```

Lý do gộp thay vì thêm một cột `footprint` song song: thêm cột thứ hai sẽ chẻ đôi khái niệm vĩnh viễn, vì hai hàng `area` cũ dùng `boundary` còn hàng mới dùng `footprint`, và mọi nơi tiêu thụ phải đọc cả hai rồi quyết định ưu tiên.
Ngoài ra `kind` sẽ nói sai, vì một nhà thờ có khuôn viên vẫn mang `kind='point'` nên badge hiện ra là "Điểm di tích".

`siteCenter()` trong `types.ts` trở thành `return site.position`.
Xoá `polygonCentroid` khỏi `types.ts` vì nó đã có bản chính ở `server/src/lib/geo.ts`.

Tạo `map-tour/src/lib/geo.ts` chỉ chứa phần phục vụ render.
Không được cài lại `areaSquareMeters` ở frontend.
Frontend tiêu thụ `areaM2`, `spanM`, `estimatedRadiusM` từ payload API.

```ts
footprintOf(site: TourSite): LatLng[] | null   // null nếu vòng dưới 3 đỉnh
footprintCenter(site: TourSite): LatLng
formatAreaM2(m2: number): string               // toLocaleString('vi-VN') + ' m²'
circlePolygon(center: LatLng, radiusMeters: number, vertices?: number): LatLng[]
```

`footprintOf` là điểm guard duy nhất cho dữ liệu KML lỗi.
Mọi chỗ đọc ranh giới phải đi qua nó.

Phía server, sửa `map-tour/server/src/routes/sites.ts` và `map-tour/server/src/services/villages.ts`.
Hai mapper trong hai file này đã gần trùng nhau sẵn, nên tách thành một `map-tour/server/src/lib/siteMapper.ts` dùng chung.
Cả hai câu SQL thêm `LEFT JOIN heritage_buildings hb ON hb.id = s.heritage_building_id` và chọn thêm `hb.land_area_m2`.
Mapper bỏ nhánh phân biệt point và area, luôn phát `position`, và phát `boundary` khi không null.
`areaM2`, `spanM`, `estimatedRadiusM` tính bằng `geo.ts` ở server.

Sửa `map-tour/server/src/services/siteAdmin.ts` để nhận `boundary` tuỳ chọn và luôn ghi toạ độ trong một câu UPDATE.

Server không import được `map-tour/src/types.ts` vì `server/tsconfig.json` đặt `rootDir: "src"`.
Quy ước của repo là nhân bản type kèm comment con trỏ, xem `map-tour/src/lib/importTypes.ts` dòng 1 đến 4.
Nhân bản type, không nhân bản phép toán.

Các chỗ `HomePage.tsx`, `HeritageListPage.tsx`, `SiteList.tsx`, `LandmarkDetailPage.tsx` vẫn đọc `kind` để hiện badge, nên không cần sửa logic.

**Tiêu chí nghiệm thu T1:**

1. `cd map-tour && npm run build` chạy sạch, không lỗi type.
2. `cd map-tour/server && npm run build` chạy sạch.
3. `cd map-tour/server && npm test` vẫn 57 test xanh trở lên.
4. Tìm trong `map-tour/src` không còn kết quả nào cho `PointSite` và `AreaSite`.
5. Tìm trong `map-tour/src` không còn định nghĩa `polygonCentroid`.
6. Gọi `GET /api/villages/lang-uoc-le/sites` trả về mọi site đều có `position`, và hai site `area` có thêm `boundary`, `areaM2` xấp xỉ 13405 và 7107, `spanM`.
7. Mở `/lang/lang-uoc-le/map` trong trình duyệt, giao diện render **y hệt như trước khi sửa**, console không có lỗi mới.
8. Nộp kèm ảnh chụp màn hình trước và sau của `/lang/lang-uoc-le/map` để đối chiếu.

### T2. Ô sửa ranh giới trong trang quản trị

Làm task này trước phần hiển thị, vì nó là cách nhập được một khuôn viên thật để kiểm các task sau bằng dữ liệu thật.

`map-tour/src/pages/AdminSitesPage.tsx` dòng 376 hiện chỉ là một ghi chú read-only.
Thay bằng một ô textarea dán toạ độ, prefill sẵn ranh giới hiện tại bằng `formatBoundaryInput`.

Thêm hai endpoint mới và mở rộng một endpoint có sẵn:

`POST /api/admin/sites/:id/boundary/preview` là endpoint mới.
Nó kiểm định và trả `{ ring, vertexCount, areaM2, centroid, detectedFormat, warnings, errors }` mà **không ghi** gì.
Đây là thứ cho ô textarea hiện được dòng "phát hiện GeoJSON, 47 đỉnh, 2.310 m², khảo sát 2.500 m²" trước khi người dùng bấm lưu.
Nhờ nó frontend không chứa dòng hình học nào.

`DELETE /api/admin/sites/:id/boundary` là endpoint mới.
Nó xoá `boundary` và trả `kind` về `'point'`.

`PATCH /api/admin/sites/:id` đã có ở `adminSites.ts` dòng 62 đến 79.
Mở rộng để nhận thêm `boundary`.
Khi lưu thì set `kind='area'`, `boundary_source='admin'`, `boundary_updated_at=now()`.

Sau mỗi lần lưu, echo lại định dạng đã nhận, số đỉnh và diện tích tính được.
Nhờ vậy một vụ đảo trục lat lng thầm lặng vẫn hiện ra cho người biên tập thấy.

Không làm công cụ vẽ polygon trên bản đồ.
Rào cản thật không phải thư viện mà là không có ảnh vệ tinh để vẽ theo, vì basemap PMTiles là vector thuần không có ảnh.
Đó chính là lý do Google My Maps trên nền ảnh vệ tinh là công cụ vẽ đúng, và ô textarea là đường sửa.

**Tiêu chí nghiệm thu T2:**

1. Cả ba định dạng dán vào đều cho cùng một vòng: GeoJSON, định dạng app, và khối `<coordinates>` thô.
2. Dán khối `<coordinates>` thật của placemark `Đình` trong map Ước Lễ, preview báo số đỉnh 8 và diện tích trong khoảng 500 đến 5000 m².
3. Dán một vòng bị đảo thành lng lat, preview báo lỗi rõ ràng và **không** ghi vào cơ sở dữ liệu.
4. Lưu rồi mở lại trang, giá trị prefill round-trip đúng nguyên văn.
5. Bấm xoá ranh giới, `kind` trở về `'point'` và truy vấn `SELECT kind, boundary FROM sites WHERE id=...` xác nhận.
6. Không có dòng nào tính diện tích hay trọng tâm ở phía client.

### T3. Tách plumbing MapLibre dùng chung

Mục tiêu task này là **không đổi gì về hình**, chỉ mở đường cho bản đồ thứ hai dùng lại hạ tầng.

Tạo `map-tour/src/lib/map/basemap.ts` và chuyển sang đó các phần sau từ `map-tour/src/components/TourMap.tsx`:

| Dòng nguồn | Nội dung |
|---|---|
| 13 và 38 đến 41 | `import mapLibreWorkerUrl` và `setWorkerUrl()` ở module top |
| 23 đến 26 | `PMTILES_SOURCE_ID` kèm comment về lược đồ OpenMapTiles |
| 89 đến 97 | `ensurePmtilesProtocol()` |
| 99 đến 210 | `visibleBasemapLayers()`, để private trong module này |
| 435 đến 449 | URL pmtiles và object style, export thành `createBasemapStyle()` |

Giữ **một** instance `Protocol` ở phạm vi module, để cache header và directory của archive được dùng chung cho cả hai bản đồ trên cùng một trang.
Thêm hằng `PMTILES_MAXZOOM = 14`, hiện là số ma thuật ở dòng 446.

Tạo `map-tour/src/lib/map/footprints.ts`.
Chuyển `closedRing()` từ dòng 212 đến 218 sang đây, và **thêm guard cho vòng rỗng**.
Hàm hiện tại destructure `ring[0]` nên crash với mảng rỗng, và bản đồ khoá mới sẽ làm lỗi đó với tới được.
Tổng quát hoá `areasToFeatureCollection()` ở dòng 220 đến 229 thành `footprintFeatureCollection(sites)` với `properties: { id, name, description, areaM2 }`.

Cố ý **không** chuyển: `escapeHtml`, `popupHtml`, `createMarkerElement`, toàn bộ khối chống chồng marker ở dòng 261 đến 378, `siteBounds`, `TOUR_ROUTE_SITE_IDS`, `fetchRouteFeature`.
Bản đồ khoá không có popup và không dựng DOM bằng chuỗi HTML nên không cần chúng.
Chuyển sẽ là thay đổi vô ích không có nơi dùng.

**Tiêu chí nghiệm thu T3:**

1. `npm run build` sạch.
2. Ảnh chụp `/lang/lang-uoc-le/map` trước và sau giống nhau về mặt thị giác.
3. Console không có lỗi 404 của worker MapLibre. Đây là rủi ro chính của việc di chuyển `setWorkerUrl`.
4. Console không có cảnh báo `Unable to perform style diff`.
5. `TourMap.tsx` giảm ít nhất 100 dòng.
6. `closedRing([])` không throw.

### T4. Component bản đồ khoá

Tạo `map-tour/src/components/SiteFootprintMap.tsx`.

Props là dữ liệu thuần, không phải một `TourSite`.
Lý do: `LandmarkDetailPage` ghép một `site` và một `building` mà mỗi cái đều có thể null, xem `LandmarkDetailPage.tsx` dòng 24 đến 38.

```ts
interface SiteFootprintMapProps {
  name: string;
  category: string;
  footprint: LatLng[] | null;
  center: LatLng;
  areaM2?: number | null;
  spanM?: { width: number; height: number } | null;
  surveyedAreaM2?: number | null;
  estimatedRadiusM?: number | null;
  maxFitZoom?: number;
}
```

Khoá tương tác bằng **một** option `interactive: false` của MapLibre.
Không disable từng handler.
Lý do thứ nhất: đây là biến thể duy nhất lật cờ nội bộ `_interactive`, và đó mới là thứ khiến MapLibre ghi `tabindex="-1"` lên canvas.
Disable từng handler sẽ để lại một canvas focus được nhưng không phản hồi gì, tức một điểm dừng tab chết giữa bài viết.

Lý do thứ hai: không listener nào được gắn nên wheel event không bị chặn, và **trang vẫn cuộn bình thường khi con trỏ ở trên bản đồ**.
Đây là điều bắt buộc với một bản đồ nhúng giữa bài trên điện thoại.

Lý do thứ ba: một bản MapLibre sau thêm gesture mới cũng được bao tự động.

Hệ quả phải xử lý: không thêm `NavigationControl`, và handler `click` hay `mouseenter` trên layer sẽ không bao giờ chạy, nên marker dự phòng phải đặt `pointer-events: none` và `aria-hidden`, không popup.

Khởi tạo:

```ts
new MapLibreMap({
  container,
  style: createBasemapStyle(),
  interactive: false,
  attributionControl: { compact: true },
  bounds: toLngLatBounds(fitBounds),
  fitBoundsOptions: { padding: 40, maxZoom: 19, minZoom: 15, duration: 0 },
  zoomLevelsToOverscale: 6,
});
map.addControl(new ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-left');
```

Truyền `bounds` trong constructor, không chờ sự kiện `load` mới đặt camera.
Nếu chờ thì request tile đầu tiên bay ra toạ độ 0,0 nằm ngoài phạm vi archive.
Lý lẽ này giống comment sẵn có ở `TourMap.tsx` dòng 428 đến 433.

Về zoom và chuyện vượt maxzoom 14 của archive.
Độ phân giải tại vĩ độ phi là `156543.03 * cos(phi) / 2^z` mét trên mỗi pixel.
Tại Ước Lễ thì là 146250 mét trên pixel ở zoom 0.
Một sân 2400 m² xấp xỉ 49 nhân 49 mét, trong khung rộng khoảng 460 pixel hữu dụng, cần zoom xấp xỉ 20,4.
Polygon `Khu làng cổ` thật rộng 13430 m² và 141 mét bề ngang vừa khung ở zoom xấp xỉ 18,9.

Vượt maxzoom 14 là chấp nhận được.
MapLibre overzoom vector tile sạch, vẫn dùng tile zoom 14 rồi render hình học ở tỉ lệ lớn hơn, không upsample raster.
Polygon footprint và thước tỉ lệ hoàn toàn không bị ảnh hưởng vì chúng dựa trên GeoJSON và phép unproject, không phải tile.
Thứ bị ảnh hưởng là độ chính xác toạ độ basemap: tile zoom 14 ở vĩ độ này rộng khoảng 2285 mét trên extent 4096 đơn vị, tức 0,56 mét mỗi đơn vị, nên ở zoom 20 góc nhà sẽ hiện thành bậc thang.
Chọn `maxFitZoom = 19` và `minFitZoom = 15`.
`minzoom: 13` trên layer `tour-basemap-buildings` là sàn không phải trần, nên ở zoom 18 đến 20 nhà vẫn render, chỉ dưới 13 mới mất.

Về resize, yêu cầu thật là **khung lại**, không phải resize.
Không tự viết `ResizeObserver`, vì option `trackResize` của MapLibre mặc định đã bật và đã có observer nội bộ debounce 50ms.
Khoảng trống nằm ở chỗ khác: `bounds` và `fitBoundsOptions` chỉ được tính theo kích thước container lúc dựng, còn `resize()` sau đó giữ nguyên tâm và zoom chứ không khung lại.
Trong một section co giãn theo `max-width` thì điều đó sai ở mọi bề rộng trừ bề rộng lúc mount.

```ts
const refit = () => map.fitBounds(bounds, { padding: 40, maxZoom: 19, minZoom: 15, duration: 0 });
map.on('resize', refit);
map.once('load', refit);
```

`map.on('resize')` ăn theo observer sẵn có nên không có observer thứ hai và không có debounce thứ hai.
Chuỗi resize sang move cũng làm mới `ScaleControl` miễn phí.

**Không** bọc section này trong `<Reveal>`.
Một `transform: translateY(18px)` ở tổ tiên đang transition trên canvas WebGL là một lần composite mỗi frame suốt 620ms mà không đổi lại được gì, còn hiệu ứng reveal thì làm chậm lần vẽ đầu của đúng phần tử người đọc đang tìm.
Dùng `<section className="landmark__section">` thường.

Deps của effect là `[footprintSignature, center, maxZoom]` với signature rẻ như `ring.length + ':' + ring[0]?.join()`, để một lần re-render với mảng mới nhưng bằng nhau không phá bản đồ.
Cleanup gọi `map.off('resize', refit)` rồi `map.remove()`.

Chip diện tích và caption phải render **ngay từ dữ liệu**, không phụ thuộc tile.
Nếu tile không bao giờ về, người đọc vẫn có con số.
Khi `map.on('error')` nổ thì thay canvas bằng `motif-lattice` kèm câu `Không tải được nền bản đồ. Diện tích khuôn viên: 13.430 m².`

**Tiêu chí nghiệm thu T4:**

1. Cuộn chuột khi con trỏ ở trên bản đồ thì **trang cuộn**, bản đồ không zoom.
2. Kéo chuột trên bản đồ không di chuyển bản đồ. Pinch trên điện thoại không zoom.
3. Chạy `document.querySelector('.maplibregl-canvas').tabIndex` trả về `-1`.
4. Nhấn Tab từ link phía trước thì con trỏ **bỏ qua hẳn** canvas.
5. Không có nút zoom của `NavigationControl` trên bản đồ.
6. Thu cửa sổ từ 1440 xuống 390 pixel, polygon **vẫn được khung lại với padding**, không bị cắt và không bị lệch tâm.
7. Kéo cửa sổ hẹp dần chậm, chỉ có một lần khung lại mỗi debounce, không nháy, console không có bão sự kiện resize.
8. Mô phỏng `prefers-reduced-motion: reduce`, camera nhảy thay vì ease.
9. Ngắt mạng rồi tải lại trang, chip diện tích và caption **vẫn hiện đúng số**, chỉ nền bản đồ báo lỗi.
10. `list_network_requests` cho thấy `vietnam.pmtiles` trả `206 Partial Content` với vài range request, **không** có GET toàn file 568MB.

### T5. Cách vẽ để cảm nhận được diện tích

Thay lớp tô vàng phẳng hiện tại ở `TourMap.tsx` dòng 493 đến 504.
Người dùng đã chọn hướng sơn ta kèm chỉ vàng.
Chính file `tokens.css` dòng 69 đến 71 đã tự ghi rằng màu `#fcd400` tô diện rộng trông như bút dạ quang chứ không phải vàng quỳ, và đó đúng là điều người dùng phàn nàn.

Năm layer, định nghĩa **một lần** trong `map-tour/src/lib/map/footprints.ts` và dùng cho **cả hai** bản đồ, để hai mặt hiển thị đọc ra cùng một đối tượng:

| Thứ tự | Layer | Vai trò |
|---|---|---|
| 1 | `tour-areas-halo` | line mờ `rgba(54,15,0,0.18)`, `line-blur` 3 đến 8 và `line-offset` 3 đến 7 theo zoom, cho hình một khối bóng |
| 2 | `tour-areas-fill` | `fill-color` `#610000`, `fill-opacity` 0,09 ở zoom 14 tới 0,15 ở zoom 17, nhạt đủ để nét nhà của basemap vẫn đọc được xuyên qua |
| 3 | `tour-areas-hatch` | `fill-pattern` `footprint-hatch`, opacity 0,55, gạch chéo 45 độ màu vàng |
| 4 | `tour-areas-line` | `line-color` `#610000`, width 1,6 tới 3 tới 4,5 theo zoom, thứ thật sự đọc ra thành ranh giới |
| 5 | `tour-areas-hairline` | chỉ vàng `#c9a227` 1px, `line-offset: -3` |

Thêm hai literal vào `map-tour/src/lib/mapColors.ts` kèm mở rộng cảnh báo đồng bộ tay sẵn có ở dòng 1 đến 4: `gold: '#c9a227'` tương ứng `--gold` ở `tokens.css` dòng 77, và `shadowInk: 'rgba(54,15,0,0.18)'`.

Giữ xanh tre cho tuyến tham quan ở dòng 564, để một đường nét đứt xanh và một lớp phủ xanh không bao giờ đấu nhau.

Gạch chéo cần một image đã đăng ký.
Viết `ensureHatchImage(map)` vẽ canvas 16 nhân 16 nhân dpr với hai nét chéo vàng 1px rồi gọi `map.addImage('footprint-hatch', ...)` sau sự kiện `load`.
Chỉ thêm layer 3 khi `addImage` thành công, và giữ layer 2 bên dưới, để một lần thất bại chỉ mất hoa văn chứ không làm hình biến mất.
Ghi nhận thẳng trong comment: `fill-pattern` lát theo không gian màn hình nên gạch chéo không giãn theo zoom, nó là cue chất liệu không phải cue tỉ lệ, còn tỉ lệ do thước và chip mang.

Thước tỉ lệ dùng lại `ScaleControl({ unit: 'metric' })` của MapLibre, không tự viết.
Nó unproject hai điểm hai bên tâm container rồi làm tròn về số đẹp, nên viết lại nghĩa là viết lại cả phép mét trên pixel theo vĩ độ và thang làm tròn 1 2 5 mà không được gì.
Nó chạy tốt khi khoá tương tác, vì `onAdd` vẽ ngay khi add và `map.resize()` phát sự kiện `move`.
Skin `.maplibregl-ctrl-scale` theo nền giấy, viền sơn ta 1px, `--font-sans`, `--text-xs`.
File `maplibre-gl.css` đã nạp sẵn ở `main.tsx` dòng 3 nên chỉ cần đè màu.

Chip m² là text React, không phải map paint.
Text thật thì chọn được, copy được, nằm trong accessibility tree, không bị canvas cắt, và sống sót khi tile lỗi.

```
DIỆN TÍCH KHUÔN VIÊN     label: --gold-deep, in hoa, --tracking-label
13.430 m²                value: --font-display, 1.4rem, --color-primary
≈ 141 × 118 m            note:  --text-xs, --color-on-surface-variant
```

Quy tắc đối chiếu với `building.landAreaM2`, vì `buildFacts()` ở `LandmarkDetailPage.tsx` dòng 118 đến 120 đã in `Diện tích khuôn viên` từ số khảo sát:

Chip **luôn** hiện diện tích tính từ polygon khi có polygon.
Nó phải mô tả đúng cái hình trên màn hình, vì in số khảo sát cạnh một polygon kích thước khác là một lời sai mà người đọc đo được bằng chính thước tỉ lệ.

Số khảo sát **giữ nguyên** vai trò trong bảng thông tin.
Nó là xuất xứ chứ không phải hình học, nên không dư thừa và không được bỏ.

Khi lệch quá 15%, chip thêm dòng thứ ba `Số liệu khảo sát: 2.100 m²` và caption thêm câu `Ranh giới vẽ trên bản đồ và số liệu khảo sát chênh nhau; số trên bản đồ là diện tích của hình vẽ.`
Không lấy trung bình, không âm thầm ưu tiên bên nào.

Nhãn chip là `DIỆN TÍCH THEO RANH GIỚI` khi cũng có số khảo sát, và `DIỆN TÍCH KHUÔN VIÊN` khi nó là số duy nhất.

Về tiếp cận, bản đồ này truyền tải thông tin nên bắt buộc có bản text tương đương:

```html
<figure class="footprint-map">
  <div class="footprint-map__frame">
    <div class="footprint-map__canvas" aria-hidden="true" />
    <div class="map-area-chip">...</div>
  </div>
  <figcaption class="footprint-map__caption">...</figcaption>
</figure>
```

`aria-hidden="true"` trên container loại canvas, thước và attribution khỏi accessibility tree, vì screen reader không đọc được chúng dù sao.
`<figcaption>` mang toàn bộ thông điệp bằng lời và hiện cho mọi người: `Ranh giới khuôn viên Khu làng cổ trên nền bản đồ làng. Diện tích khoảng 13.430 m², tương đương một khu đất chừng 141 × 118 m. Thanh tỷ lệ: 20 m. Bản đồ này không thu phóng được.`
Chip **không** được `aria-hidden`, vì chính nó và caption là bản tương đương.

**Tiêu chí nghiệm thu T5:**

1. Nét nhà của basemap **vẫn đọc được xuyên qua** lớp phủ, không bị lấp.
2. Zoom từ 14 lên 19 trên `/map`, fill và line giãn liên tục, không có hiện tượng nhảy bậc.
3. Chặn `addImage` thất bại một cách nhân tạo, hình **vẫn hiện** với 4 layer còn lại, console không có cảnh báo missing image treo lại.
4. Thước tỉ lệ đọc ra một số tròn hợp lý, và đo bề ngang polygon trên màn hình theo thước cho ra xấp xỉ giá trị `spanM.width`.
5. `take_snapshot` cho thấy text chip và figcaption **có** trong accessibility tree, còn vùng MapLibre **không** có.
6. Một địa danh có cả polygon và `landAreaM2` lệch quá 15%, chip hiện đủ ba dòng và caption có câu giải thích chênh lệch.
7. Bảng `Thông tin khảo sát` **vẫn** còn dòng `Diện tích khuôn viên`, không bị xoá.

### T6. Trường hợp chưa có ranh giới

Đây là trường hợp phổ biến nhất lúc đầu, vì 80 trên 130 site sẽ chưa có polygon.
Nó phải trông **có chủ ý**, không phải trông hỏng.

Vẽ vòng tròn bằng polygon sinh ra, **không** dùng layer `circle`.
`circle-radius` tính bằng pixel màn hình, nên một vòng 30px là 30px ở mọi zoom và không đại diện cho mét nào.
Giả lập bằng `interpolate` theo zoom thì sai ở mọi vĩ độ trừ cái đã tinh chỉnh, và vỡ ngay khi `maxFitZoom` chặn.

```
delta = r / 6378137
lat_i = lat + (delta * cos(theta_i)) * 180 / pi
lng_i = lng + (delta * sin(theta_i)) * 180 / pi / cos(lat * pi / 180)
```

Số hạng `cos(lat)` ở dòng `lng_i` là chỗ sai kinh điển, phải có test riêng.
Dùng 64 đỉnh, vì 36 đỉnh đã thấy cạnh mờ ở bán kính 30 mét render rộng 350 pixel.

Suy ra bán kính theo đúng quyết định đã chốt với người dùng:

1. Có `landAreaM2` khảo sát thì dùng `sqrt(A / pi)`. Đây là cách đọc trung thực, nghĩa là một vòng tròn bao đúng diện tích mà khảo sát ghi nhận.
2. **Không có căn cứ nào thì không vẽ vòng.** Chỉ hiện marker và caption trung thực. Một bán kính bịa ra kèm đường nét đứt tự tin còn tệ hơn là không có gì.

Hàm `estimatedRadiusMeters` ở `server/src/lib/geo.ts` đã cài đúng quy tắc này và trả `null` khi không có căn cứ.
Không được thêm bảng bán kính mặc định theo category.

Kiểu vẽ phải là một loại phát biểu khác hẳn ranh giới đã khảo sát:

- `tour-estimate-fill` với `fill-opacity` 0,05, tức một nửa lớp phủ đã khảo sát.
- `tour-estimate-line` với width 2, opacity 0,55, và `line-dasharray [2, 2.5]`, vì nét đứt nghĩa là chưa đo.
- Không halo, không gạch chéo và không chỉ vàng, vì những thứ đó đọc ra là đã khảo sát.

Marker ở giữa dùng lại `getCategoryStyle(category)` từ `siteCategories.ts` dòng 36 đến 38, dựng thành `Marker` DOM thường, đặt `pointer-events: none` và `aria-hidden`, và **mang class `tour-marker--compact`** để là một chấm 18px theo `index.css` dòng 163 đến 177.
Nó không được giành lấy tâm của hình.

Chữ tiếng Việt phải dùng đúng nguyên văn sau.

Badge góc trên phải khung: `Chưa khảo sát ranh giới`

Chip khi có số khảo sát: nhãn `DIỆN TÍCH KHẢO SÁT`, giá trị `≈ 2.400 m²`, ghi chú `bán kính phỏng đoán ≈ 28 m`

Caption khi có số khảo sát: `Chưa khảo sát ranh giới. Vòng tròn nét đứt chỉ là phạm vi phỏng đoán quanh vị trí điểm, bán kính khoảng 28 m - không phải ranh giới thực của khuôn viên.`

Khi không có căn cứ diện tích: giữ badge, **bỏ chip**, caption là `Chưa khảo sát ranh giới và chưa có số liệu diện tích. Bản đồ chỉ hiển thị vị trí của điểm di sản.`

**Tiêu chí nghiệm thu T6:**

1. Đo đường kính vòng tròn trên màn hình bằng thước tỉ lệ, kết quả khớp `2 * r` trong sai số 5%.
2. Zoom bản đồ ra vào, vòng tròn **giãn theo bản đồ**, không giữ nguyên kích thước pixel.
3. Một site không polygon **và** không `landAreaM2` thì **không có vòng tròn nào**, chỉ marker và caption đúng nguyên văn.
4. Marker giữa là chấm 18px, không phải badge 32px, và không bắt được click.
5. Chuỗi tiếng Việt khớp **đúng nguyên văn** bảng trên, kể cả dấu và khoảng trắng.
6. Một record chỉ có building mà không có site, ví dụ Chùa Sổ vào từ danh sách di sản, thì **không** hiện section bản đồ, không khung rỗng, không lỗi console.

### T7. Chèn vào trang chi tiết địa danh và sửa trang /map

Phần chèn vào trang chi tiết.
Vị trí là ngay **sau** block `Thông tin khảo sát` đóng ở `LandmarkDetailPage.tsx` dòng 382, và **trước** block `Giới thiệu` mở ở dòng 384.
Bảng thông tin cho con số, bản đồ cho thấy con số đó nghĩa là gì, rồi mới đến phần văn.
Điều kiện hiện là `record.site`, vì `TourSite` là nguồn toạ độ duy nhất.

Tiêu đề là `Quy mô khuôn viên`, không phải `Bản đồ`, vì section này nói về kích thước còn bản đồ chỉ là dụng cụ.
Câu dẫn dưới tiêu đề: `Bản đồ dưới đây chỉ hiển thị riêng khu vực này, giữ nguyên tỷ lệ thật để thấy được hình dạng và độ rộng của khuôn viên.`

Nút `Xem trên bản đồ` ở dòng 336 đến 344 **không** dư thừa, vì giờ nó trả lời một câu khác.
Đổi nhãn thành `Xem trong bản đồ làng` để hai mặt hiển thị phân biệt được, và giữ điều hướng `?site=`.

Phần sửa trang `/map`.

Hiện footprint cho các site vốn là `point`.
Thêm `footprintSites = sites.filter(s => footprintOf(s) !== null)` và dùng `footprintOf`, để một site `point` có `boundary` được vẽ y như một site `area`.
Giữ nguyên các id `tour-areas`, `tour-areas-fill`, `tour-areas-line`, để handler click ở dòng 506 đến 515, hover cursor ở dòng 516 đến 521 và biểu thức selection ở dòng 595 đến 602 không mất target.

**Lỗi bắt buộc phải sửa:** dòng 513 tra popup bằng `areaSites.find(...)` rồi dùng dấu `!`.
Phải đổi thành `footprintSites.find(...)`.
Nếu bỏ sót, bấm vào polygon của một site `point` mới sẽ throw.

Marker neo tại `footprintCenter(site)` thay vì `siteCenter(site)`, để một site có ghim lệch tâm trong polygon vẫn được badge nằm trong hình.
Nhưng **định tuyến vẫn dùng `siteCenter`** ở `MapPage.tsx` dòng 34 và `TourMap.tsx` dòng 551.
Một tuyến đường nên bắt đầu ở ghim đã ghi, thường là cổng, chứ không phải trọng tâm thửa.
Làm ngược sẽ đặt điểm đầu và cuối tuyến vào giữa toà nhà.

Chuyển giao marker và footprint theo từng site.
Hiện `updateMarkers` ở dòng 534 đến 543 tính một boolean `compact` toàn cục từ zoom.
Comment sẵn có ở dòng 43 đến 48 đã nói ra luật thật: thu badge lại khi hình nó đánh dấu nhỏ hơn chính cái badge trên màn hình.
Có footprint rồi thì luật đó đánh giá được cho từng site:

```
compact(site) = hasFootprint(site)
  ? projectedSpanPx(site) < MARKER_BADGE_SIZE * 1.5
  : map.getZoom() < MARKER_LABEL_MIN_ZOOM
```

`projectedSpanPx` là `min(width, height)` của bounds footprint sau `map.project()`, tính trong cùng lượt với `resolveMarkerLayout` ở dòng 328 đến 378.

Ba hằng `MARKER_LABEL_MIN_ZOOM = 16`, `MARKER_BADGE_SIZE = 32`, `MARKER_BADGE_SIZE_COMPACT = 18` ở dòng 49 đến 58 **không được đổi**.
Chúng phải khớp tay với CSS ở `index.css` dòng 98 đến 232.
Task này đổi **khi nào** một class được áp, không bao giờ đổi một kích thước, và đó là toàn bộ lý do luật viết dạng predicate thay vì thêm một bậc kích thước mới.
Thêm một dòng comment ở dòng 49 ghi rằng việc thu gọn giờ còn phụ thuộc span footprint đã project.

Sửa lỗi camera không di chuyển khi chọn địa danh.
Hiện `MapPage.tsx` dòng 22 đọc `?site=` vào state, còn `TourMap.tsx` dòng 586 đến 608 chỉ bật tắt class và đổi `line-width`.
Không chỗ nào trong `src` gọi một phương thức camera.

```ts
function focusSite(map, site, animate) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = animate && !reduce ? 700 : 0;
  const ring = footprintOf(site);
  if (ring) map.fitBounds(toLngLatBounds(boundsOf(ring)), { padding: 80, maxZoom: 18, duration });
  else map.easeTo({ center: toLngLat(siteCenter(site)), zoom: Math.max(map.getZoom(), 17), duration });
}
```

Chọn một điểm **không bao giờ zoom ra**, nhờ `Math.max`, nên bấm một ghim khi đang xem toàn làng không quăng mất ngữ cảnh.

Cách nối dây phải tránh đấu với effect keyed `[sites]` ở dòng 584.
Với deep link và state ban đầu, gọi `focusSite(map, site, false)` **bên trong** chính handler `map.on('load')` sẵn có ở dòng 479, sau khi marker và footprint đã tồn tại, và đọc `selectedIdRef.current` vì ref luôn cập nhật.
Vì nó nằm trong cùng effect dựng bản đồ, một lần đổi identity của `sites` phá rồi dựng lại bản đồ sẽ tự chạy lại nó và focus được phục hồi.
Không thêm state mới, không epoch counter, và **không thêm dep vào dòng 584**.
Với các lần chọn sau, mở rộng effect `[selectedId]` ở dòng 586 đến 608 và chặn bằng `if (!map.isStyleLoaded()) return;`.

Người dùng đã chốt hành vi **chỉ di khi cần**.
Bỏ qua `focusSite` khi mục tiêu đã nằm thoải mái trong khung, định nghĩa là bounds footprint nằm hoàn toàn trong viewport thu vào 15% **và** rộng hơn 8% bề ngang viewport.
Deep link và bấm sidebar vẫn di, còn bấm một ghim đang hiện rõ trước mắt thì không.

Con số diện tích khi chọn.
`SiteList.tsx` dòng 48 đổi `site-list__meta` thành `Khu vực · 13.430 m²` khi có footprint, ngược lại giữ nguyên như hiện nay.
`MapPage.tsx` render `<SiteAreaChip site={selectedSite} />` trong `.app__map` ở dòng 74 đến 82, dùng **cùng class `.map-area-chip`** với bản đồ khoá.
`.app__map` đã có `position: relative` ở `map.css` dòng 92 đến 96 nên không đổi layout.
`MapPage` đã có `sites` và `selectedId` nên `TourMap` **không cần prop mới** nào cho việc này.

Tuyến tham quan ở dòng 545 đến 571, chỉ đường ở dòng 610 đến 639 và popup phải tiếp tục hoạt động y như trước.

Đồng bộ URL khi chọn là **tuỳ chọn và mặc định tắt**, vì nó đổi hành vi history của trình duyệt.

**Tiêu chí nghiệm thu T7:**

1. Mở `/lang/lang-uoc-le/map?site=20000000-0000-0000-0000-000000000005`, camera **khung đúng vào polygon Khu làng cổ**, không phải toàn làng. Dòng sidebar active. Chip đọc `13.430 m²`.
2. Mở `?site=20000000-0000-0000-0000-000000000001` là một điểm, camera ease tới ghim ở zoom từ 17, và **không zoom ra**.
3. Bấm một dòng sidebar xa khung hiện tại thì camera di, rồi bấm một ghim đang ở giữa khung thì camera **không** di.
4. Bấm vào polygon của một site `point` mới có boundary, popup mở đúng và **không throw**. Đây là kiểm chứng cho lỗi dòng 513.
5. Chọn hai site rồi dùng chỉ đường, tuyến đường bắt đầu ở **ghim đã ghi** chứ không phải trọng tâm thửa.
6. Tuyến tham quan dạng nét đứt vẫn vẽ đúng như trước.
7. Section `Quy mô khuôn viên` nằm **đúng** giữa `Thông tin khảo sát` và `Giới thiệu`.
8. Nút đã đổi nhãn thành `Xem trong bản đồ làng` và vẫn điều hướng đúng.
9. Ba hằng marker ở `TourMap.tsx` dòng 49 đến 58 **không đổi giá trị**, và CSS `.tour-marker` ở `index.css` dòng 98 đến 232 **không bị sửa**.
10. Zoom ra xa trên `/map`, marker của một footprint nhỏ thu về chấm, còn marker của một footprint lớn vẫn giữ badge và nhãn.

### T8. CSS

Tạo `map-tour/src/styles/footprint-map.css` và import thành dòng mới **sau** `map.css` ở `map-tour/src/index.css` dòng 9.
Phải là dòng cuối, để đè được style control của `maplibre-gl.css` vốn nạp trước từ `main.tsx` dòng 3.

Nội dung gồm: `.footprint-map` là figure với margin 0; `.footprint-map__frame` với `position: relative`, `aspect-ratio: 16/9`, `max-height: 60vh`, `border-radius: var(--radius-sm)`, `overflow: hidden`.
Dùng **cùng khung** với `.landmark__gallery-frame` ở `landmark.css` dòng 218 đến 227, để bản đồ đọc ra như một tấm nữa trong bài.
Thêm `.footprint-map__canvas` với inset 0, `__status`, `__badge` theo tiền lệ `.site-list__panorama-btn` ở `map.css` dòng 208 đến 223, và `__caption` theo `.landmark__gallery-caption` ở `landmark.css` dòng 236 đến 240.
`.map-area-chip` cùng các phần `__label`, `__value`, `__note`, `__survey` đặt ở file này vì **dùng chung** cho bản đồ khoá và overlay `/map`, và do phần tử cha định vị.
Thêm skin `.maplibregl-ctrl-scale`.

Trong `@media (max-width: 900px)`, khung đổi sang `aspect-ratio: 4/3` và `max-height: 52vh`, chip nhỏ một bậc, và **chip cùng thước xếp tầng để không chồng nhau** trong khung rộng khoảng 360 pixel.
Khớp breakpoint 900px sẵn có ở `map.css` dòng 244 và `landmark.css` dòng 512.

Trong `@media (prefers-reduced-motion: reduce)`, bỏ fade của chip và đặt `duration: 0` cho mọi lần di camera bằng code.
CSS không với tới camera của MapLibre nên phải cưỡng chế cả trong JavaScript, theo đúng cách `map.css` dòng 231 đến 236 đang làm.

`map-tour/src/styles/map.css` chỉ thêm `.app__map > .map-area-chip` với `top: .85rem`, `left: .85rem`, `z-index: 2`, và một ghi chú trong block `@media (max-width: 900px)` ở dòng 244 đến 270 giữ nó tránh thứ tự stack mobile.

`map-tour/src/styles/landmark.css` thêm một `.landmark__section-lead` cạnh `.landmark__section-head h2` ở dòng 207 đến 211.

`map-tour/src/index.css` chỉ có hai thay đổi: dòng `@import` mới, và `.map-popup__area` cạnh `.map-popup p` ở dòng 277 đến 283.
**Không được chạm** `.tour-marker` và các biến thể của nó ở dòng 98 đến 232.
Đọc lại comment ở dòng 83 đến 97 trước khi định sửa.

**Tiêu chí nghiệm thu T8:**

1. Ở bề rộng 390 pixel, chip và thước tỉ lệ **không chồng lên nhau**.
2. Khung bản đồ khoá có cùng bán kính góc và cùng cách bo như `.landmark__gallery-frame`, nhìn liền mạch với các tấm ảnh khác trong bài.
3. Bật `prefers-reduced-motion`, không có animation nào của chip và không có camera ease.
4. `git diff` trên `index.css` chỉ có hai vùng thay đổi, và **không** có thay đổi nào trong vùng dòng 98 đến 232.

### T9. Trình nhập KML

Làm dạng endpoint upload trong trang quản trị, không phải script chạy tay.
Lý do: người dùng sẽ export lại từ My Maps nhiều lần khi sửa polygon; Postgres production không mở port; và đường ray parse rồi review rồi commit **đã có sẵn** đúng luồng cần thiết ở `routes/admin.ts` dòng 59 đến 89, multer memoryStorage ở dòng 20, `requireAdminKey` ở dòng 57, cùng cả giao diện chọn lại dòng nhập nhằng ở `AdminImportPage.tsx` dòng 51 đến 57.

```
POST /api/admin/import/kml/parse    multer .single('file') kèm field villageId  -> ParsedKmlImport
POST /api/admin/import/kml/commit   JSON body là ParsedKmlImport đã sửa         -> KmlCommitSummary
```

Route mới ở `map-tour/server/src/routes/adminKml.ts`, gác bởi `requireAdminKey`, đăng ký ở `server/src/index.ts` dòng 28.
Trang mới ở `map-tour/src/pages/AdminKmlImportPage.tsx`.
Thêm `map-tour/server/scripts/import-kml.ts` làm vỏ CLI mỏng theo quy ước `server/scripts/import-*.ts` sẵn có, dùng để nạp lô đầu tiên, và **không chứa logic parse riêng**.

Hai dependency mới, đều pure JavaScript nên không ảnh hưởng bản build Docker:

`jszip` cho KMZ, vì KMZ là file ZIP còn `zlib` của Node chỉ cho DEFLATE thô không đọc được container ZIP.
Nó đã có trong `node_modules` dạng transitive của exceljs nên cài thêm gần như không tốn gì, nhưng **phải khai báo trực tiếp**.
Đọc entry đầu khớp `/\.kml$/i`, bỏ qua entry ảnh, và báo lỗi nêu rõ tìm thấy gì nếu có 0 hoặc nhiều hơn 1 entry `.kml`.

`fast-xml-parser` cho XML.
**Không** dùng regex, vì regex vỡ với CDATA trong `<description>`, vỡ với thực thể `&amp;` trong tên tiếng Việt, và không thấy được thẻ `<tessellate>` chen giữa `<LinearRing>` và `<coordinates>` như mục 4.2 đã ghi.

Luật parse: tách `<coordinates>` theo mọi khoảng trắng sau khi trim; mỗi tuple tách theo dấu phẩy, nhận 2 hoặc 3 thành phần và bỏ độ cao; **đảo về `[lat, lng]`**; làm tròn 7 chữ số thập phân tương đương 11mm; bỏ đỉnh trùng liên tiếp; và **bỏ đỉnh đóng vòng của KML** vì app lưu vòng mở.
Có thể dùng `openRing` sẵn có ở `boundaryValidate.ts` cho hai bước cuối.
Bỏ qua hoàn toàn `<Style>` và `<StyleMap>`, vì mục đích là restyle theo web.
Một số bản xuất lồng `Document > Document` thay vì `Document > Folder`, nên phải đệ quy qua cả hai.

Lỗ hổng và nhiều mảnh bị **từ chối kèm thông báo giải thích**, tuyệt đối không âm thầm lấy vòng lớn nhất.
Mục 4.2 đã xác nhận dữ liệu hiện tại không có ca nào, nên đây chỉ là lưới an toàn.

Khớp polygon với site phải **ưu tiên vị trí, không phải tên**, theo đúng số đo ở mục 4.4.
Upload **bắt buộc chọn `villageId`**, vì mỗi làng một map riêng nên điều này tự nhiên, và tên như `Đình làng` lặp giữa các làng.

Bộ chấm điểm gợi ý, đã đo cho ra 51 khớp tự tin trên 136 polygon:

| Tín hiệu | Điểm |
|---|---|
| Ghim site nằm trong polygon | 100 |
| Trọng tâm polygon cách ghim không quá 30 mét | `60 - khoảng_cách * 2` |
| Tên đã chuẩn hoá trùng khớp | 80 |
| Tên đã chuẩn hoá chứa nhau | 40 |
| Folder ánh xạ đúng category của site | 20 |

Từ 100 điểm trở lên là khớp tự tin.
Từ 40 đến 99 là khớp yếu và **bắt buộc** có xác nhận từng dòng trong payload commit.
Dưới 40 là không khớp.

Chuẩn hoá tên phải là bản của `LandmarkDetailPage.tsx` dòng 40 **cộng thêm `.normalize('NFC')`**, và thêm bước bỏ tiền tố chỉ ranh giới dạng `ranh giới`, `ranh`, `rảnh`.
Hàm hiện tại thiếu bước NFC.
Bản xuất của Google có thể ở dạng NFD, nơi chuỗi `Đình` viết bằng D cộng dấu tổ hợp khác byte với bản NFC.
**Đây là lỗi thầm lặng có xác suất cao nhất trong toàn bộ tính năng**, vì mọi placemark sẽ lặng lẽ rơi vào nhóm không khớp và người dùng kết luận công cụ hỏng.

Người dùng đã chốt: polygon không khớp thì **tạo site mới**, không bỏ qua.
Category lấy từ bảng ánh xạ folder ở mục 4.3.
Với map kiểu generic thì folder không cho category, nên để trống và bắt người dùng chọn trong bước xem trước.
Tên lấy từ tên polygon.
Những polygon tên dạng `Đa giác NN` thì đặt nhãn tạm theo folder cộng số thứ tự, và đánh dấu để người dùng đổi tên sau.
Site mới có `position = polygonCentroid(ring)`, `kind='area'`, `boundary_source='kml'`.

Site chưa có polygon thì **không chạm tới**.
Báo cáo liệt kê tên và số lượng, vì đó chính là danh sách việc cho buổi vẽ My Maps tiếp theo.

Idempotent: khớp theo `id` của site, commit là `UPDATE sites SET boundary = $2::jsonb, kind = 'area', boundary_source = 'kml', boundary_updated_at = now() WHERE id = $1`.
Nạp lại cùng file phải ghi ra giá trị y hệt.
Hàng có `boundary_source = 'admin'` bị **bỏ qua và báo là được bảo vệ**, trừ khi payload đặt `overwriteAdminEdits: true` cho từng dòng.
Đây là lý do tồn tại của cột `boundary_source`.
Toàn bộ commit nằm trong một transaction.

Báo cáo xem trước phải có: `matched` kèm `confidence`, `vertexCount`, `areaM2`, `landAreaM2`, `centroid`, `warnings`, `protected`; `ambiguous` kèm danh sách ứng viên; `unmatched`; `unsupported`; `rejected`; `sitesWithoutBoundary`; và `counts`.
`LineString` và `Point` **không** được liệt kê thành từng dòng, chỉ đếm tổng, vì một map có tới 188 LineString.

**Tiêu chí nghiệm thu T9:**

1. Chạy dry-run trên cả 6 file KML, tổng `matched` cộng `ambiguous` cộng `unmatched` bằng **136**.
2. Số khớp tự tin đạt **ít nhất 51**. Nếu thấp hơn, báo lại số đo thực tế và nguyên nhân, không tự hạ tiêu chí.
3. Sau khi commit cả 6 làng, truy vấn `SELECT count(*) FROM sites WHERE boundary IS NOT NULL` cho **ít nhất 50**.
4. Mỗi làng trong 6 làng có **ít nhất 5** site có ranh giới.
5. Có test riêng cho ca **NFD so với NFC** của chuỗi `Đình làng Ước Lễ`, và test đó phải khớp ở mức `exact`.
6. Có test khẳng định `MultiGeometry` nhiều polygon cho ra `unsupported` và **vòng không bị âm thầm cắt còn mảnh đầu**.
7. Có test khẳng định đỉnh đóng vòng bị bỏ.
8. Có test khẳng định `Document > Document` cho kết quả y như `Document > Folder`.
9. Nạp lại **cùng một file** lần thứ hai, không hàng nào thay đổi giá trị, và số liệu báo cáo giống hệt lần đầu.
10. Sửa tay một ranh giới trong trang quản trị rồi nạp lại KML, dòng đó được báo là **được bảo vệ** và giá trị sửa tay **không bị ghi đè**.
11. Báo cáo **không** liệt kê từng `LineString`.
12. `npm test` ở server vẫn xanh toàn bộ.

### T10. Sửa lỗi category trong cơ sở dữ liệu

Người dùng đã chốt làm việc này, kèm báo cáo trước khi ghi.

Ở Làng Chuông, các site `Chùa`, `Đình làng`, `Đền Ông`, `Nhà thờ` đều bị gán `category = 'Giao thông'`.
Tên folder trong KML cho category đúng.
Category sai còn làm marker sai màu và sai icon, vì `getCategoryStyle` rơi về `FALLBACK_STYLE`.

Xuất một báo cáo dạng `site X: 'Giao thông' -> 'Di tích tín ngưỡng'` cho người dùng xem trước, rồi mới ghi.
Chỉ đề xuất sửa cho các site khớp được với một polygon trong map kiểu semantic, vì chỉ ở đó folder mới mang thông tin category.

Ghi nhận riêng: 68 trên 132 site đang dùng chuỗi category **không có** trong `map-tour/src/lib/siteCategories.ts` dòng 29 đến 37, gồm `Giao thông` 39 site, `Mặt nước` 15, `Nhà ở` 7, `Cây` 6, `Nhà công cộng` 5, `Tiện ích du lịch` 1.
Tất cả rơi về `FALLBACK_STYLE` nên hiện sai màu và sai icon.
Đây là lỗi có sẵn từ trước, ngoài phạm vi các task trên, nhưng cần bổ sung style cho chúng.

**Tiêu chí nghiệm thu T10:**

1. Có bản backup trước khi ghi.
2. Báo cáo được xuất ra và duyệt trước khi ghi, không ghi trực tiếp.
3. Sau khi sửa, `Chùa` và `Đình làng` ở Làng Chuông **không còn** mang category `Giao thông`.
4. Mọi chuỗi category đang tồn tại trong cơ sở dữ liệu đều có style riêng trong `siteCategories.ts`, không còn site nào rơi về `FALLBACK_STYLE`.
5. Mở `/lang/lang-chuong/map`, marker của chùa và đình hiện đúng màu và đúng icon theo loại hình.

### T11. Ghi chú riêng: Chùa Sổ

`chùa sổ` có polygon trong KML và có bản ghi trong bảng `heritage_buildings`, nhưng **chưa** có bản ghi trong bảng `sites`.
Tạo site mới cho nó sẽ cho Chùa Sổ đồng thời cả ranh giới lẫn dữ liệu khảo sát, vì `LandmarkDetailPage` ghép site và building theo tên đã chuẩn hoá.

Đây là một ca kiểm chứng tốt cho T9 và T5 cùng lúc.

**Tiêu chí nghiệm thu T11:** mở trang chi tiết Chùa Sổ, trang hiện đủ cả bảng `Thông tin khảo sát` lấy từ building **và** section `Quy mô khuôn viên` lấy từ ranh giới.

## 6. Rủi ro phải để ý

File `map-tour/public/tiles/vietnam.pmtiles` nặng 568MB và bị nhân đôi vào `dist`.
Trang chi tiết giờ tạo bản đồ MapLibre **thứ hai**, tức WebGL context thứ hai và một archive reader nữa.
Giảm nhẹ bằng ba cách: giữ một instance `Protocol` dùng chung trong `basemap.ts`; đặt **đúng một** `SiteFootprintMap` mỗi trang và tuyệt đối không đặt vào card `Điểm di sản lân cận` ở `LandmarkDetailPage.tsx` dòng 412 đến 422; và destroy bản đồ khi unmount.

Effect keyed `[sites]` ở `TourMap.tsx` dòng 584 phá rồi dựng lại cả bản đồ khi identity của `sites` đổi.
**Không thêm dep vào nó.**
Nếu ai thêm `selectedId` vào đó, mỗi lần chọn sẽ phá bản đồ.
Đặt một comment cảnh báo ngay tại dep array.

Vòng KML suy biến gồm dưới 3 đỉnh, tự cắt, chưa khép, chiều quay ngược.
`footprintOf` trả `null` dưới 3 đỉnh, và `areaSquareMeters` đã lấy giá trị tuyệt đối.
Một vòng tự cắt sẽ vẽ hình nơ và báo diện tích sai vì triệt tiêu một phần, nên trình nhập phải từ chối nó, và **frontend không được cố sửa hình học**.

Không có công cụ chạy migration tự động.
Migration 015 phải chạy tay bằng psql trên mọi môi trường.
Một Docker volume mới chỉ chạy thư mục `init` vốn vẫn giữ ràng buộc cũ, nên một lần deploy mới cần chạy migration 001 đến 015 theo thứ tự.
File `init/02_schema.sql` dòng 156 đến 160 sẽ lệch vĩnh viễn với lược đồ thật, đúng như `init` đã lệch sẵn vì `001_schema_alignment.sql`.
Nên có `scripts/migrate.sh` chạy `psql -f` theo thứ tự sắp xếp, nhưng đó là việc ngoài phạm vi và chỉ cần nêu ra.

Sau migration 015, chạy lại `migrations/004_seed_sites.sql` sẽ trượt ràng buộc `NOT NULL` ở hai hàng số 5 và 6.
Xác nhận seed không bao giờ được replay lên cơ sở dữ liệu đang chạy, hoặc sửa câu upsert của file 004 để mang theo hai giá trị trọng tâm.

## 7. Quy trình nghiệm thu

Với mỗi task, agent thực thi phải nộp lại đúng bốn thứ sau.

Thứ nhất, danh sách file đã thay đổi kèm `git diff --stat`.

Thứ hai, kết quả chạy thật của các lệnh kiểm: `npm run build` ở cả `map-tour` và `map-tour/server`, và `npm test` ở `map-tour/server`.
Dán nguyên văn phần tóm tắt kết quả, không viết lại bằng lời.

Thứ ba, bằng chứng cho **từng** tiêu chí nghiệm thu của task đó, theo đúng thứ tự đã đánh số.
Tiêu chí nào cần nhìn bằng mắt thì kèm ảnh chụp màn hình.
Tiêu chí nào cần số đo thì kèm số đo thật, không kèm phỏng đoán.

Thứ tư, danh sách những gì **không** đạt, nếu có, kèm lý do và số đo.

Task bị trả lại nếu gặp bất kỳ điều nào sau đây.

Có tiêu chí nghiệm thu không có bằng chứng kèm theo.
Bằng chứng là lời khẳng định suông thay vì kết quả chạy thật hoặc ảnh chụp.
`npm run build` hoặc `npm test` không sạch.
Số test giảm so với mốc 57.
Tiêu chí bị tự nới lỏng mà không báo.
Có dấu gạch dài trong mã hoặc trong văn bản sinh ra.
Ba hằng marker bị đổi giá trị, hoặc vùng `.tour-marker` trong `index.css` bị sửa, ở các task không được phép.
Có phép toán hình học bị cài lại ở frontend.
Có thay đổi lược đồ mà không backup trước.
