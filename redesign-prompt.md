# Bản giao việc: redesign chuyển động, hiệu ứng và bản đồ custom cho Map Tour

Tài liệu này là một prompt giao việc, viết theo đúng khuôn mẫu `plan.md` và các file `review*.md` đã dùng trong dự án này.
Dán nguyên văn tài liệu này cho agent thực thi (dù đó là Antigravity, một phiên bản GPT, hay bất kỳ AI coding agent nào khác).
Người giao việc giữ vai trò giao việc và nghiệm thu, không trực tiếp code các task dưới đây.
Mỗi task có tiêu chí nghiệm thu riêng, task chỉ được coi là xong khi toàn bộ tiêu chí của nó đạt.

## 0. Đọc trước khi bắt đầu

Dự án đã trải qua nhiều vòng redesign trước đó, ghi lại trong `plan.md`, `review.md`, `review2.md`, `review3.md` ở gốc repo.
Đọc bốn file đó trước khi code, vì chúng chứa các quyết định đã chốt và các lỗi đã từng mắc phải.
Không lặp lại các lỗi đã ghi trong `review3.md`, đặc biệt là R16 (camera bản đồ giật vô cớ), R17 và R18 (bản đồ bị khoá zoom nhưng thiếu mô tả cho trình đọc màn hình, link attribution kẹt trong vùng `aria-hidden`).
Vòng việc này là bước tiếp theo, không phải làm lại từ đầu.

Dự án đã có sẵn một hệ thống thiết kế tên "sơn mài" (Vietnamese lacquer heritage system), định nghĩa đầy đủ trong `src/styles/tokens.css`.
Ba màu duy nhất của hệ thống là đỏ son (`--color-primary #610000`), vàng thếp (`--gold #c9a227`) và xanh lá tre (`--color-tertiary #203200`).
Font hiển thị là Playfair Display, font thân chữ là Be Vietnam Pro, cả hai được chọn vì hỗ trợ đầy đủ dấu tiếng Việt xếp chồng.
Bo góc gần vuông (`--radius-sm: 2px`) là chủ đích, mô phỏng khung gỗ và bậc đá, không phải thiếu sót cần "làm tròn cho hiện đại".
Đã có một component chuyển động tên `Reveal` (`src/components/Reveal.tsx`) dùng `IntersectionObserver` để hiện dần nội dung khi cuộn tới, tự tắt dưới `prefers-reduced-motion`.
Đọc kỹ token `--ease`, `--duration`, `--duration-slow` trong `tokens.css` trước khi thêm chuyển động mới, vì mục tiêu là mọi hiệu ứng dùng chung một đường cong easing, không phải mỗi chỗ một kiểu.

**Không được coi bất kỳ điều nào ở trên là lỗi cần sửa.**
Đây là nền đã được nghiệm thu.
Việc của vòng này là nâng cấp và mở rộng nó, không phải thay thế bằng một hệ thống màu, font hay bo góc khác.

## 1. Mục tiêu của vòng redesign này

Ba mục tiêu chính, theo đúng thứ tự ưu tiên.

Một, bổ sung chuyển động (animation) và hiệu ứng (effects) cho toàn bộ trang web, ở những nơi hiện đang tĩnh hoặc chuyển cảnh đột ngột.

Hai, làm bản đồ custom đẹp hơn, có bản sắc riêng, không còn trông như một bản đồ mặc định của thư viện.

Ba, rà soát và bổ sung các phần thông tin/trạng thái còn thiếu trên toàn site, những thứ dễ bị bỏ quên khi tập trung vào tính năng chính (empty state, error state, loading state, SEO, 404, v.v).

Bốn, được phép thiết kế lại tổng thể giao diện (layout, bố cục, thành phần) để đẹp hơn, không giới hạn ở chỉnh sửa nhỏ lẻ.
Điều kiện bắt buộc đi kèm: giữ nguyên bản sắc truyền thống, cổ truyền của website (xem lại hệ thống "sơn mài" ở mục 0), và bảo đảm giao diện chạy tốt, đẹp, dùng được thật sự trên cả máy tính (PC) lẫn điện thoại di động (mobile), không chỉ đẹp trên một loại màn hình rồi vỡ ở loại kia.

## 2. Nguyên tắc bắt buộc khi thực thi

Không dùng dấu gạch dài (em dash) trong bất kỳ văn bản nào sinh ra, kể cả comment, commit message và chuỗi hiển thị trên UI.
Dùng dấu gạch thường "-" thay thế.

Khi viết hoặc sửa nhiều file Markdown, đặt mỗi câu trên một dòng riêng, giống cách tài liệu này được viết.

Khi ra quyết định kỹ thuật, không coi trọng chi phí phát triển.
Ưu tiên chất lượng, tính đơn giản, độ bền, khả năng mở rộng và khả năng bảo trì dài hạn.
Nếu một hiệu ứng đẹp nhưng làm rối code hoặc phải fork thư viện, chọn phương án đơn giản hơn dù kém lộng lẫy hơn một chút.

Khi sửa bug phát sinh trong lúc làm animation hoặc bản đồ, luôn bắt đầu bằng việc tái hiện lỗi trong môi trường end-to-end gần nhất với cách người dùng thật gặp nó, trên trình duyệt thật, không chỉ đọc code rồi đoán.

Khi kiểm thử end-to-end, phải khắt khe với giao diện nhìn thấy.
Nếu có gì rõ ràng trông sai hoặc giật cục, kể cả không liên quan trực tiếp tới task đang làm, vẫn phải sửa.
Áp dụng cùng tiêu chuẩn khắt khe đó cho lint, test lỗi và test chập chờn: thấy là sửa, không lờ đi vì "không phải việc của mình".

Mọi animation mới bắt buộc phải tôn trọng `prefers-reduced-motion`, đúng như `Reveal.tsx` đã làm.
Không có ngoại lệ, kể cả animation trên bản đồ.

Mọi thay đổi lược đồ cơ sở dữ liệu, nếu có, phải chạy `bash scripts/backup.sh` trước, và mọi migration phải dry-run trong một transaction rồi `ROLLBACK` trước khi áp thật.

Không được tự nới lỏng tiêu chí nghiệm thu ở mục 7.
Nếu một tiêu chí không đạt được, báo lại kèm lý do và số đo cụ thể, không im lặng bỏ qua hoặc tự ý coi là "đủ tốt rồi".

## 3. Ràng buộc kỹ thuật cứng

Không đổi stack hiện có.
Frontend là React 18 + TypeScript + Vite, bản đồ là MapLibre GL JS đọc trực tiếp file `vietnam.pmtiles` (schema OpenMapTiles), ảnh 360 dùng `@photo-sphere-viewer/core`, routing dùng `react-router-dom`.
Không migrate sang Mapbox GL JS (cần token trả phí), không đổi sang Leaflet, không đổi build tool.

Nếu cần thêm thư viện animation (ví dụ Framer Motion hoặc GSAP) vì `Reveal.tsx` tự viết tay không đủ cho nhu cầu mới, được phép thêm, nhưng phải:
kiểm tra `package.json` trước để tránh cài trùng,
giải thích trong phần bàn giao vì sao giải pháp tự viết không đáp ứng được,
và không dùng thư viện đó để thay thế `Reveal.tsx` ở những chỗ nó đang chạy tốt.

Không sửa các hằng số kích thước marker hay vùng CSS `.tour-marker` trong `index.css` mà không nêu lý do bằng số đo cụ thể, đúng điều kiện đã ghi trong `review3.md` mục 6.
Đây là khu vực đã tốn nhiều vòng nghiệm thu để ổn định.

Không đổi bảng màu ba sắc son/vàng/tre trong `tokens.css` sang một bảng màu khác.
Được phép bổ sung biến số mới (ví dụ biến cho shadow màu, biến cho gradient noise) miễn là chúng phái sinh từ ba màu gốc, không phải màu ngoài hệ thống.

Giữ nguyên các quyết định tiếp cận (accessibility) đã nghiệm thu ở `review3.md`: caption mô tả cho bản đồ bị khoá zoom, `aria-hidden` chỉ đặt lên canvas chứ không đặt lên cả container có chứa link attribution, nút "Xem 360°" ẩn khi site không có ảnh panorama.

Về phạm vi "thiết kế lại tổng thể" ở mục tiêu 4: được phép đổi layout, bố cục lưới, kích thước và cách sắp xếp thành phần trên mọi trang, kể cả viết lại phần lớn CSS của một trang nếu cần, miễn là bốn thứ sau không đổi bản chất: bộ ba màu son/vàng/tre và các biến trong `tokens.css`, cặp font Playfair Display/Be Vietnam Pro, ngôn ngữ bo góc gần vuông (`--radius-sm`/`--radius-md`), và các hoa văn/motif đã có trong `motifs.css`.
Nói cách khác: đổi cách sắp đặt, không đổi chất liệu.
Một trang sau khi thiết kế lại phải vẫn nhận ra ngay là cùng một website với các trang chưa động tới, không được để một trang trông "hiện đại phương Tây" còn trang khác vẫn "sơn mài truyền thống".

## 4. Phạm vi công việc

### A. Chuyển động và hiệu ứng toàn site

Hiện trạng.
Chỉ có `Reveal.tsx` xử lý hiện dần khi cuộn tới, dùng cho một số section trong `VillageIntroductionSections.tsx`.
Chuyển trang giữa các route (`/lang/:slug/gioi-thieu`, `/map`, `/di-san`, `/kien-truc`, `/360`) hiện không có transition, đổi cảnh đột ngột.
Danh sách địa danh (`SiteList.tsx`) và các trang admin không có stagger khi item xuất hiện.
Nút bấm và card hiện có hover nhưng cần rà lại độ mượt và nhất quán easing.

Task A1. Page transition giữa các route con của một làng.
Thêm chuyển cảnh mượt (fade kết hợp dịch chuyển nhẹ theo trục Y, dùng `transform` và `opacity`, không dùng `top`/`left`) khi chuyển giữa các trang trong `routes.ts`.
Dùng chung `--ease` và một trong các biến `--duration*` đã có trong `tokens.css`.
Nghiệm thu: chuyển từ `/gioi-thieu` sang `/di-san` và ngược lại không có khung hình trắng chớp, không giật, hoạt động đúng cả khi bấm nút back của trình duyệt.

Task A2. Stagger reveal cho danh sách địa danh và card di sản.
Áp `Reveal` (hoặc mở rộng nó nếu cần prop mới) cho từng item trong `SiteList.tsx`, `HeritageListPage.tsx`, `ArchitectureHighlightsPage.tsx`, để các item xuất hiện nối tiếp nhau khi cuộn tới thay vì đồng loạt.
Nghiệm thu: cuộn tới danh sách, các item hiện lần lượt cách nhau khoảng đúng bằng `STEP_MS` hiện có trong `Reveal.tsx`, tối đa `MAX_STEPS` bậc trễ.

Task A3. Vi tương tác (micro-interaction) cho nút và card.
Rà soát toàn bộ nút bấm, card địa danh, thẻ trong admin: thêm trạng thái hover (đổi nền hoặc nâng nhẹ bằng shadow) và trạng thái nhấn (`scale(0.98)` hoặc dịch nhẹ), transition 160-320ms theo `--duration-fast`/`--duration`.
Nghiệm thu: không còn phần tử bấm được nào chuyển trạng thái tức thời (0ms) hoặc hoàn toàn không đổi khi hover/focus.

Task A4. Parallax nhẹ cho phần giới thiệu làng.
`VillageIntroductionSections.tsx` (nhiều section ảnh full-bleed) là nơi phù hợp nhất cho hiệu ứng parallax nhẹ (ảnh nền di chuyển chậm hơn nội dung khi cuộn).
Biên độ phải nhỏ, mục tiêu là cảm giác chiều sâu chứ không phải chóng mặt.
Nghiệm thu: cuộn qua các section ảnh, ảnh nền dịch chuyển chậm hơn văn bản một cách rõ nhưng không gây khó đọc; tắt hẳn khi `prefers-reduced-motion: reduce`.

Task A5. Trạng thái loading có hình dạng (skeleton).
Những nơi đang chờ dữ liệu từ API (`SitesContext`, danh sách trong admin) hiện dùng gì để báo đang tải, cần rà soát: nếu là khoảng trắng hoặc spinner tròn chung chung, thay bằng skeleton có hình dạng giống layout thật (thanh xám bo góc `--radius-sm`, nhấp nháy nhẹ).
Nghiệm thu: tải chậm mạng giả lập (throttle trong DevTools), người dùng thấy hình dạng trước khi thấy nội dung thật, không thấy khoảng trắng trống hoặc spinner mặc định của trình duyệt.

### B. Bản đồ custom đẹp hơn

Hiện trạng, đọc kỹ trước khi động vào các file này.
`src/components/TourMap.tsx` dựng bản đồ tổng quan, vẽ marker cho site `point` bằng `maplibregl.Marker`, vẽ polygon cho site `area` từ một nguồn GeoJSON, vẽ tuyến đường đi bộ thực tế qua OSRM.
`src/lib/map/basemap.ts` cấu hình style bản đồ nền (`osm-bright-style.json`, đã chỉnh để không cần API key).
`src/lib/map/footprints.ts` xử lý dựng layer `fill`/`line` cho các khu vực có ranh giới.
`src/lib/mapColors.ts` là nơi neo màu bản đồ, các giá trị này bắt buộc phải trùng tay với `tokens.css` vì paint property của MapLibre không đọc được CSS custom property.
`src/components/SiteFootprintMap.tsx` là bản đồ mặt bằng khoá cứng (không zoom, không kéo) cho một địa danh, đã qua nhiều vòng nghiệm thu về tiếp cận (xem R17, R18, R19 trong `review3.md`).

Task B1. Marker theo category thay vì hình tròn chung.
Hiện marker dùng chung một hình dạng cho mọi loại địa danh (đình, chùa, giếng, xưởng nghề...).
Xem `src/lib/siteCategories.ts` để lấy danh sách category đã có.
Thiết kế một bộ icon nhỏ, đơn sắc, phong cách khắc gỗ/con dấu (ăn khớp thẩm mỹ sơn mài) cho từng category, đặt trong viên marker hình giọt nước hoặc hình khiên hiện có, tô màu theo `MAP_COLORS`.
Không dùng icon set kiểu Lucide/Feather mặc định cho việc này, vì nó sẽ phá vỡ phong cách heritage.
Nghiệm thu: mở `/map`, mỗi category có icon riêng phân biệt được bằng mắt ở khoảng cách zoom mặc định, chú giải (legend) khớp đúng icon đang hiển thị trên bản đồ.

Task B2. Cụm marker (clustering) khi nhiều điểm gần nhau.
Với làng có mật độ site cao, marker chồng lên nhau ở mức zoom thấp.
Thêm clustering (dùng tính năng cluster có sẵn của MapLibre GeoJSON source, không cần thư viện ngoài) hiện số lượng điểm trong cụm, tách ra khi zoom vào hoặc bấm vào cụm.
Nghiệm thu: ở zoom mức xa nhất hiện tại của một làng có trên 8 site point, các marker gần nhau gộp thành một cụm có số; bấm cụm zoom mượt vào đúng khu vực đó rồi tự tách marker.

Task B3. Popup custom theo hệ thống thiết kế.
Rà soát CSS popup hiện tại trong `map.css`.
Popup phải dùng đúng token (`--color-panel`, `--shadow-panel`, `--radius-sm`, font `--font-serif` cho tên địa danh), có mũi tên chỉ đúng vào marker, có transition mở/đóng mượt (fade + scale nhẹ từ điểm neo, không phải mặc định "popup" cứng của MapLibre).
Nghiệm thu: bấm marker, popup mở bằng animation mượt dưới 300ms, đóng cũng có animation, không còn giao diện popup mặc định của MapLibre lộ ra ở bất kỳ khung hình nào.

Task B4. Vẽ tuyến đường có animation.
Tuyến đường đi bộ hiện lấy từ OSRM và vẽ tĩnh.
Thêm hiệu ứng vẽ dần đường đi (path drawing animation) khi tuyến đường xuất hiện lần đầu, dùng kỹ thuật `line-dasharray` động hoặc cắt dần GeoJSON theo phần trăm chiều dài.
Chỉ chạy animation một lần khi tuyến đường được thêm vào bản đồ, không lặp lại mỗi khi pan/zoom.
Nghiệm thu: lần đầu vào `/map`, tuyến đường "vẽ" từ điểm đầu tới điểm cuối trong khoảng 1-2 giây, sau đó giữ nguyên, không animate lại khi kéo bản đồ.

Task B5. Camera fly-to mượt hơn và tôn trọng quyết định "chỉ di khi cần".
`review3.md` mục R16 đã chốt hành vi: bấm một ghim đang hiện rõ trước mắt thì camera không giật.
Giữ nguyên hành vi đó.
Việc cần làm ở đây chỉ là chỉnh easing/duration của `flyTo` khi camera thực sự cần di chuyển, cho cảm giác bay tới mượt hơn (dùng `essential: true`, `curve` hợp lý, tránh xóc ở cuối chuyển động).
Nghiệm thu: các trường hợp camera phải di chuyển (theo đúng điều kiện R16) chuyển động mượt, không giật ở điểm dừng; các trường hợp không cần di chuyển vẫn đứng yên như đã nghiệm thu.

Task B6. Hiệu ứng hover cho khu vực (polygon).
Khi rê chuột qua một polygon khu vực trên bản đồ tổng quan, hiện chưa có phản hồi thị giác rõ ràng ngoài con trỏ đổi hình.
Thêm hiệu ứng sáng nhẹ viền hoặc tăng độ mờ fill khi hover, dùng `feature-state` của MapLibre để không phải re-render toàn bộ layer.
Nghiệm thu: rê chuột qua một polygon, viền hoặc fill đổi rõ trong dưới 100ms, trả lại trạng thái gốc khi rê ra ngoài, không giật hình khi rê nhanh qua nhiều polygon liên tiếp.

Task B7. Trạng thái tải bản đồ.
File `vietnam.pmtiles` nặng khoảng 570MB, tải theo range request, có thể có độ trễ đáng kể trên mạng chậm.
Thêm trạng thái tải rõ ràng (skeleton khung bản đồ hoặc chỉ báo tiến trình nhẹ) thay vì để người dùng nhìn một khung xám hoặc trắng trong lúc chờ.
Nghiệm thu: throttle mạng trong DevTools xuống "Slow 3G", vào `/map`, thấy trạng thái tải rõ ràng thay vì khung trống, bản đồ mượt chuyển sang hiển thị thật khi tải xong.

### C. Bổ sung thông tin và trạng thái còn thiếu

Đây là phần "thông tin khác" cần rà soát thêm, những thứ dễ bị bỏ sót khi tập trung vào tính năng chính.

Task C1. Kiểm kê ảnh placeholder chưa thay bằng ảnh thật.
`README.md` đã tự cảnh báo: 6 ảnh 360 trong `public/panoramas/` là ảnh CC0 từ Poly Haven, không phải ảnh chụp thật tại các địa điểm.
Lập danh sách toàn bộ ảnh (panorama, ảnh giới thiệu làng, ảnh trong `AdminHeritageBuildingsPage`) đang là placeholder, output ra một file `assets-audit.md` liệt kê rõ ảnh nào là thật, ảnh nào cần thay, đường dẫn cụ thể.
Không tự ý xoá hoặc thay ảnh, chỉ liệt kê để người phụ trách nội dung xử lý.

Task C2. SEO và thẻ meta theo từng làng.
Vì route có dạng `/lang/:villageSlug/...`, mỗi làng cần `<title>` và `<meta description>` riêng, không dùng chung một tiêu đề tĩnh cho mọi làng.
Thêm `og:image` lấy ảnh đại diện của làng đó khi chia sẻ link.
Nghiệm thu: xem `document.title` khi chuyển giữa hai làng khác nhau, tiêu đề đổi đúng theo tên làng; kiểm tra thẻ `og:image` trỏ đúng ảnh của làng đang xem.

Task C3. Trang 404 và điều hướng quay lại.
Kiểm tra hiện tại khi vào một `villageSlug` không tồn tại hoặc một route không khớp, ứng dụng hiển thị gì.
Nếu là màn hình trắng hoặc lỗi console, thiết kế một trang 404 mang đúng phong cách sơn mài, có đường dẫn quay về trang chủ hoặc danh sách làng.
Rà thêm toàn site xem có "ngõ cụt" nào không có đường quay lại.
Nghiệm thu: vào một URL sai, thấy trang 404 có thiết kế nhất quán, có nút quay về; test bằng Playwright hoặc Chrome DevTools MCP, không phải chỉ đọc code.

Task C4. Trạng thái rỗng (empty state) cho danh sách chưa có dữ liệu.
Nếu một làng chưa có địa danh nào được nhập, hoặc bộ lọc category trả về rỗng, kiểm tra hiện đang hiển thị gì.
Thiết kế trạng thái rỗng có minh hoạ nhẹ và câu hướng dẫn tiếp theo, không để danh sách trống trơn không giải thích.
Nghiệm thu: lọc theo một category không có site nào, thấy thông báo rõ ràng thay vì danh sách trắng.

Task C5. Rà soát toàn bộ thông báo lỗi hiển thị cho người dùng.
Đúng như đã sửa ở R15 trong `review3.md` (lỗi Postgres lộ nguyên văn ra client), rà lại toàn bộ các nhánh catch lỗi ở frontend (`adminApi.ts`, các trang admin) xem có nơi nào còn hiện lỗi kỹ thuật thô (stack trace, mã lỗi SQL, thông điệp tiếng Anh của thư viện) cho người dùng cuối không.
Thay bằng thông báo tiếng Việt, cụ thể, không dùng `window.alert()`.
Nghiệm thu: giả lập một request admin thất bại (tắt server tạm thời), thông báo hiện ra là câu tiếng Việt dễ hiểu, không có thuật ngữ kỹ thuật lộ ra.

Task C6. Favicon và thẻ chia sẻ mạng xã hội.
Kiểm tra `index.html` hiện có favicon phù hợp bản sắc sơn mài chưa (không phải icon mặc định của Vite).
Nghiệm thu: tab trình duyệt hiện favicon riêng của dự án, không phải logo Vite.

### D. Thiết kế lại tổng thể giao diện, giữ bản sắc truyền thống, đảm bảo chạy tốt trên PC và mobile

Hiện trạng.
Hệ thống token đã có, nhưng chưa chắc mọi trang đã tận dụng hết để tạo cảm giác cao cấp, đồng bộ.
Cũng chưa có audit responsive toàn diện: một số màn hình (bản đồ, popup, modal panorama, trang admin) vốn phức tạp về bố cục, dễ vỡ ở màn hình hẹp nếu chỉ test trên desktop.

Task D1. Rà soát và thiết kế lại từng trang chính cho đẹp và nhất quán hơn.
Áp dụng cho `HomePage.tsx`, `VillagesPortalPage.tsx`, `VillageIntroductionPage.tsx`, `MapPage.tsx`, `HeritageListPage.tsx`, `LandmarkDetailPage.tsx`, `ArchitectureHighlightsPage.tsx`, `Experience3DPage.tsx`.
Với mỗi trang, có thể đổi bố cục lưới, tỷ lệ ảnh, cách chia cột, khoảng trắng, thứ tự thị giác, miễn giữ đúng bốn thứ bất biến đã nêu ở mục 3 (bộ màu, cặp font, ngôn ngữ bo góc, motif).
Nghiệm thu: đặt hai ảnh chụp cạnh nhau, một trang đã sửa và một trang tham chiếu (ví dụ trang giới thiệu làng khác chưa sửa), người xem nhận ra ngay cùng một hệ thống thiết kế; không trang nào dùng bo góc tròn lớn, font khác, hoặc màu ngoài bộ ba đã định.

Task D2. Audit responsive tại các mốc màn hình cụ thể.
Kiểm tra và sửa mọi trang tại đúng ba mốc: 390px (điện thoại phổ biến), 768px (tablet/máy tính bảng), 1440px (desktop).
Với mỗi mốc, không được có thanh cuộn ngang ngoài ý muốn, không có chữ bị cắt hoặc chồng lên nhau, không có ảnh vỡ tỷ lệ.
Nghiệm thu: chụp ảnh toàn trang ở cả ba mốc cho từng trang liệt kê ở D1, không trang nào có thanh cuộn ngang khi đo `document.documentElement.scrollWidth` so với `window.innerWidth`.

Task D3. Vùng chạm (touch target) và điều hướng trên mobile.
Rà soát `NavBar.tsx` và mọi nút bấm, link, marker bản đồ trên màn hình cảm ứng: kích thước vùng chạm tối thiểu 44x44px theo chuẩn WCAG, menu điều hướng chuyển sang dạng phù hợp cho mobile (ví dụ menu rút gọn) nếu hiện đang là thanh ngang tràn màn hình.
Nghiệm thu: đo bằng DevTools ở chế độ mobile, mọi phần tử bấm được có vùng chạm tối thiểu 44x44px; menu điều hướng không bị tràn hoặc phải cuộn ngang ở 390px.

Task D4. Bản đồ và modal panorama dùng được thật trên cảm ứng.
`TourMap.tsx`, `SiteFootprintMap.tsx` và `PanoramaModal.tsx`/`PanoramaViewer.tsx` phải thao tác được bằng cử chỉ chạm: pinch để zoom bản đồ, kéo một ngón để xoay ảnh 360, nút đóng modal đủ lớn để bấm bằng ngón tay.
Popup trên bản đồ không được tràn ra ngoài viewport ở màn hình hẹp.
Nghiệm thu: giả lập thiết bị di động trong Chrome DevTools (`emulate`), thao tác pinch-zoom bản đồ và kéo xoay ảnh 360 hoạt động đúng, popup luôn nằm gọn trong viewport ở 390px.

Task D5. Trang quản trị (admin) cũng phải dùng được trên tablet.
Các trang `AdminSitesPage.tsx`, `AdminKmlImportPage.tsx`, `AdminHeritageBuildingsPage.tsx`, `AdminImportPage.tsx` hiện có thể đang giả định màn hình rộng (bảng nhiều cột, form nhiều trường ngang hàng).
Không cần đẹp bằng các trang công khai, nhưng phải dùng được ở độ rộng tablet 768px, không bị vỡ bảng hoặc form.
Nghiệm thu: mở từng trang admin ở 768px, thao tác thêm/sửa một bản ghi thành công, không có phần tử form bị cắt hoặc che khuất nút submit.

## 5. Không được làm

Không cài thêm thư viện bản đồ thứ hai chạy song song với MapLibre.

Không đổi định dạng dữ liệu `TourSite`, `boundary`, `position_lat/lng` đã chốt ở `migrations/015_sites_position_and_footprint.sql`.

Không xoá hoặc viết đè `plan.md`, `review.md`, `review2.md`, `review3.md`.
Nếu cần văn bản trạng thái mới, tạo file mới, ví dụ `review4.md`.

Không dùng `window.alert()`, không để sót `console.log` trong code khi nộp bài.

Không tự thêm animation lặp vô hạn (perpetual loop) kiểu banner quảng cáo nhấp nháy liên tục.
Chuyển động chỉ nên xảy ra khi có tương tác hoặc khi phần tử lần đầu vào khung nhìn.

Không thiết kế lại một trang theo phong cách hoàn toàn khác biệt (ví dụ flat design tối giản kiểu SaaS phương Tây, hoặc theme sáng/tối tuỳ chọn) rồi để các trang khác giữ nguyên phong cách sơn mài.
Việc thiết kế lại chỉ được coi là hoàn thành khi áp dụng nhất quán cho toàn bộ các trang liệt kê ở Task D1, không được làm nửa chừng một vài trang rồi dừng.

## 6. Danh sách file khả năng phải chạm tới

Tham khảo nhanh, không phải danh sách đóng, agent có thể cần chạm file khác nếu có lý do.

```
map-tour/src/components/Reveal.tsx
map-tour/src/components/TourMap.tsx
map-tour/src/components/SiteFootprintMap.tsx
map-tour/src/components/SiteList.tsx
map-tour/src/components/VillageIntroductionSections.tsx
map-tour/src/components/VillageLayout.tsx
map-tour/src/components/NavBar.tsx
map-tour/src/components/AdminNav.tsx
map-tour/src/components/PanoramaModal.tsx
map-tour/src/components/PanoramaViewer.tsx
map-tour/src/pages/HomePage.tsx
map-tour/src/pages/VillagesPortalPage.tsx
map-tour/src/pages/LandmarkDetailPage.tsx
map-tour/src/pages/AdminSitesPage.tsx
map-tour/src/pages/AdminKmlImportPage.tsx
map-tour/src/pages/AdminHeritageBuildingsPage.tsx
map-tour/src/index.css
map-tour/src/lib/map/basemap.ts
map-tour/src/lib/map/footprints.ts
map-tour/src/lib/mapColors.ts
map-tour/src/lib/siteCategories.ts
map-tour/src/styles/tokens.css
map-tour/src/styles/map.css
map-tour/src/styles/motifs.css
map-tour/src/styles/footprint-map.css
map-tour/src/styles/village.css
map-tour/src/pages/MapPage.tsx
map-tour/src/pages/HeritageListPage.tsx
map-tour/src/pages/ArchitectureHighlightsPage.tsx
map-tour/src/pages/VillageIntroductionPage.tsx
map-tour/src/routes.ts
map-tour/index.html
map-tour/server/src/routes/adminSites.ts
map-tour/src/lib/adminApi.ts
```

## 7. Quy trình nộp và nghiệm thu

Nộp kèm bốn thứ, thiếu một là trả lại ngay, đúng khuôn mẫu đã dùng ở `review3.md`.

Một, `git diff --stat` của toàn bộ thay đổi.

Hai, kết quả chạy thật của `npm run build` ở cả `map-tour/` và `map-tour/server/`, cùng `npm test` ở server, dán nguyên văn, không tóm tắt.

Ba, bằng chứng cho từng task từ A1 tới D5 theo đúng mã số.
Với các task về animation và bản đồ, bằng chứng phải là video ngắn hoặc chuỗi ảnh chụp (Chrome DevTools MCP `take_screenshot`) thể hiện được chuyển động, không phải một ảnh tĩnh duy nhất.
Với các task về nội dung/trạng thái (mục C), bằng chứng là ảnh chụp màn hình của từng trạng thái mô tả trong tiêu chí nghiệm thu.
Với các task về thiết kế lại tổng thể và responsive (mục D), bằng chứng bắt buộc phải gồm ảnh chụp ở cả ba mốc 390px, 768px, 1440px cho từng trang liệt kê ở D1, không được nộp chỉ ảnh desktop.

Bốn, danh sách những gì chưa đạt kèm số đo cụ thể, nếu có, không được viết "cơ bản đã ổn" mà không kèm số.

Trả lại ngay nếu: thiếu bằng chứng cho một mã; bằng chứng là lời khẳng định suông không kèm ảnh/video; build hoặc test không sạch; có dấu gạch dài ở bất kỳ đâu; sửa hằng số marker hoặc `.tour-marker` mà không giải thích; đổi bảng màu ba sắc gốc; thêm animation lặp vô hạn; bỏ qua `prefers-reduced-motion` ở animation mới; hoặc ghi vào cơ sở dữ liệu mà không sao lưu trước.

Khi toàn bộ task A, B, C, D đạt tiêu chí và không có mục nào ở mục 5 bị vi phạm, vòng redesign này coi là pass và sẵn sàng review lần cuối trước khi merge.
