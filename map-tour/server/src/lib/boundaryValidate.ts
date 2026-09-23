// Kiểm định một vòng ranh giới trước khi ghi vào sites.boundary.
//
// Dùng CHUNG cho hai đường ghi: trình nhập KML (routes/adminKml.ts) và ô dán
// toạ độ trong trang quản trị (services/siteAdmin.ts). Một bản cài đặt, một bộ
// test — nếu tách ra hai chỗ thì hai đường sẽ lệch nhau.
//
// Không bao giờ throw: trả về vòng đã chuẩn hoá kèm errors[] và warnings[], để
// bước xem trước của trình nhập hiện được TẤT CẢ vấn đề của TẤT CẢ placemark
// trong một lần, thay vì dừng ở cái đầu tiên.
//
// Thông báo bằng tiếng Việt không dấu ở phần mã lỗi? Không — có dấu, cho khớp
// các thông báo admin hiện có (services/siteAdmin.ts).

import { areaSquareMeters, boundsOf, normalizeWinding, polygonCentroid, type Bounds, type LatLng } from './geo.js';

export interface ValidateContext {
  /** Hộp bao suy ra từ các site SẴN CÓ của chính làng đó. */
  villageBounds: Bounds;
  /** Số khảo sát heritage_buildings.land_area_m2, nếu site này có. */
  landAreaM2?: number | null;
}

export interface ValidateResult {
  /** Vòng đã bỏ đỉnh trùng/đỉnh đóng và chuẩn hoá chiều quay. Rỗng nếu có lỗi nặng. */
  ring: LatLng[];
  areaM2: number;
  centroid: LatLng | null;
  errors: string[];
  warnings: string[];
}

/**
 * Nới hộp bao làng ra bấy nhiêu mét trước khi kiểm đỉnh nằm trong/ngoài.
 *
 * Hiệu chuẩn bằng số đo thật, không phải phỏng đoán:
 *   * Hộp bao lõi làng Ước Lễ chỉ 457 × 355 m, nhưng Chùa Sổ — di tích có
 *     trong heritage_buildings — nằm 547 m phía nam. Ngưỡng 500 m từ chối oan
 *     đúng hình đó.
 *   * Cặp làng GẦN NHAU NHẤT (Làng Chuông <-> Ước Lễ) cách 5,0 km. Với 1 500 m
 *     nới, hai hộp bao đã nới vẫn cách nhau khoảng 2 km, nên việc gán sai làng
 *     vẫn bị bắt với biên độ rất rộng.
 *   * Lỗi đảo lat/lng đã bị chặn trước đó bởi phép kiểm |lat| > 90, nên luật
 *     này không phải gánh việc đó.
 * Nói cách khác 1 500 m mua được dữ liệu thật mà không mất khả năng phát hiện.
 */
const VILLAGE_BOUNDS_PAD_M = 1500;
/**
 * Sàn cho bề rộng hộp bao làng. Làng ít điểm cho hộp bao gần suy biến (một
 * làng chỉ có 1–2 site thì hộp bao gần như một điểm) và khi đó 500 m nới là
 * tất cả những gì còn lại. Nới tối thiểu tới 1 km để vòng hợp lý vẫn qua được.
 */
const VILLAGE_BOUNDS_MIN_SPAN_M = 3000;

/** Lớn hơn cả bề rộng của làng rộng nhất (~1,8 km) nên chắc chắn là lỗi. */
const MAX_AREA_M2 = 1_000_000;
/** Đình làng Ước Lễ khảo sát 2 500 m², Chùa Sổ 5 000 m² — 5 ha đã rất rộng. */
const WARN_AREA_M2 = 50_000;
/**
 * Sàn cảnh báo diện tích nhỏ. Hiệu chuẩn lại theo 136 polygon thật: ngưỡng
 * 50 m² (con số phỏng đoán lúc lập kế hoạch) kêu oan 11 lần — nhà cổ ở Làng
 * Cựu 18–50 m², miếu trình 30 m², nhà thờ họ 44 m², đền ngõ họ 39 m². Nhà
 * truyền thống 5 × 6 m đúng bằng 30 m², nên đó là kích thước BÌNH THƯỜNG.
 * Một hình bấm lỡ tay thì chỉ vài m², nên 10 m² mới là ngưỡng có nghĩa.
 */
const WARN_MIN_AREA_M2 = 10;
/** Hình vẽ tay trong My Maps dưới 100 đỉnh; trên mức này là phình jsonb. */
const WARN_VERTEX_COUNT = 500;
/** Vẽ tay trên ảnh vệ tinh thường trong ~10%; quá 3× là khả năng khớp sai chỗ. */
const WARN_AREA_RATIO = 3;

const M_PER_DEG_LAT = 111_195.08;

/**
 * Bỏ đỉnh đóng vòng của KML và các đỉnh trùng liên tiếp (kể cả cặp cuối–đầu).
 * App lưu vòng MỞ; closedRing() ở frontend khép lại lúc render.
 */
export function openRing(ring: LatLng[]): LatLng[] {
  const out: LatLng[] = [];
  for (const point of ring) {
    const previous = out[out.length - 1];
    if (previous && previous[0] === point[0] && previous[1] === point[1]) continue;
    out.push(point);
  }
  while (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) out.pop();
    else break;
  }
  return out;
}

/** Hộp bao của các site sẵn có trong một làng, đã nới để dùng làm vùng hợp lệ. */
export function villageBoundsFrom(points: LatLng[]): Bounds {
  const raw = boundsOf(points);
  const midLat = (raw.south + raw.north) / 2;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos(midLat * (Math.PI / 180));

  const spanLatM = (raw.north - raw.south) * M_PER_DEG_LAT;
  const spanLngM = (raw.east - raw.west) * mPerDegLng;
  const padLatM = Math.max(VILLAGE_BOUNDS_PAD_M, (VILLAGE_BOUNDS_MIN_SPAN_M - spanLatM) / 2);
  const padLngM = Math.max(VILLAGE_BOUNDS_PAD_M, (VILLAGE_BOUNDS_MIN_SPAN_M - spanLngM) / 2);

  return {
    south: raw.south - padLatM / M_PER_DEG_LAT,
    north: raw.north + padLatM / M_PER_DEG_LAT,
    west: raw.west - padLngM / mPerDegLng,
    east: raw.east + padLngM / mPerDegLng,
  };
}

function segmentsIntersect(a: LatLng, b: LatLng, c: LatLng, d: LatLng): boolean {
  const cross = (p: LatLng, q: LatLng, r: LatLng) =>
    (q[1] - p[1]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[1] - p[1]);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/**
 * Vòng có tự cắt không. O(n²) nhưng n là vài chục tới vài trăm nên miễn phí.
 * Chỉ xét các cặp cạnh KHÔNG kề nhau — cạnh kề luôn "cắt" nhau ở đỉnh chung.
 */
export function isSelfIntersecting(ring: LatLng[]): boolean {
  const n = ring.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i || (j + 1) % n === i || (i + 1) % n === j) continue;
      if (segmentsIntersect(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n])) return true;
    }
  }
  return false;
}

export function validateRing(input: LatLng[], context: ValidateContext): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fail = (): ValidateResult => ({ ring: [], areaM2: 0, centroid: null, errors, warnings });

  for (const point of input) {
    if (!Array.isArray(point) || point.length < 2) {
      errors.push('Ranh giới có đỉnh không đúng dạng [vĩ độ, kinh độ].');
      return fail();
    }
    const [lat, lng] = point;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push('Ranh giới có đỉnh chứa giá trị không phải số hữu hạn.');
      return fail();
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      errors.push(
        `Đỉnh [${lat}, ${lng}] nằm ngoài phạm vi toạ độ hợp lệ. ` +
          'Thường là do đảo thứ tự: app lưu [vĩ độ, kinh độ], còn GeoJSON/KML là [kinh độ, vĩ độ].',
      );
      return fail();
    }
  }

  const ring = openRing(input);
  if (ring.length < 3) {
    errors.push(`Ranh giới chỉ có ${ring.length} đỉnh phân biệt, cần ít nhất 3.`);
    return fail();
  }

  // Kiểm nằm trong hộp bao làng. Đây là bộ phát hiện đảo lat/lng giá trị nhất:
  // một vòng bị đảo rơi vào vĩ độ ~105 và đã bị chặn ở trên, còn vòng khớp sai
  // làng thì bị chặn ở đây.
  const { villageBounds } = context;
  const outside = ring.filter(
    ([lat, lng]) =>
      lat < villageBounds.south ||
      lat > villageBounds.north ||
      lng < villageBounds.west ||
      lng > villageBounds.east,
  );
  if (outside.length > 0) {
    const [lat, lng] = outside[0];
    errors.push(
      `Ranh giới nằm ngoài phạm vi làng (${outside.length}/${ring.length} đỉnh, ` +
        `ví dụ [${lat.toFixed(6)}, ${lng.toFixed(6)}]). Kiểm tra lại đã chọn đúng làng chưa.`,
    );
    return fail();
  }

  if (isSelfIntersecting(ring)) {
    errors.push(
      'Đường ranh giới tự cắt chính nó nên không xác định được diện tích. ' +
        'Vẽ lại hình trong Google My Maps để các cạnh không chồng lên nhau.',
    );
    return fail();
  }

  const areaM2 = areaSquareMeters(ring);
  if (areaM2 <= 0) {
    errors.push('Ranh giới có diện tích bằng 0 (các đỉnh thẳng hàng hoặc trùng nhau).');
    return fail();
  }
  if (areaM2 > MAX_AREA_M2) {
    errors.push(
      `Diện tích ${Math.round(areaM2).toLocaleString('vi-VN')} m² lớn hơn 1 km², ` +
        'rộng hơn cả một làng nên chắc chắn là hình vẽ sai.',
    );
    return fail();
  }

  if (areaM2 > WARN_AREA_M2) {
    warnings.push(
      `Diện tích ${Math.round(areaM2).toLocaleString('vi-VN')} m² (trên 5 ha) là rất rộng cho một địa danh.`,
    );
  }
  if (areaM2 < WARN_MIN_AREA_M2) {
    warnings.push(
      `Diện tích chỉ ${Math.round(areaM2)} m² (nhỏ hơn 10 m²) — kiểm tra lại hình có bị bấm lỡ tay không.`,
    );
  }
  if (ring.length > WARN_VERTEX_COUNT) {
    warnings.push(`Ranh giới có ${ring.length} đỉnh, nhiều hơn mức cần thiết cho một hình vẽ tay.`);
  }

  const surveyed = context.landAreaM2;
  if (surveyed !== null && surveyed !== undefined && Number.isFinite(surveyed) && surveyed > 0) {
    const ratio = areaM2 / surveyed;
    if (ratio > WARN_AREA_RATIO || ratio < 1 / WARN_AREA_RATIO) {
      warnings.push(
        `Diện tích hình vẽ ${Math.round(areaM2).toLocaleString('vi-VN')} m² lệch ` +
          `${ratio.toFixed(1)}× so với số khảo sát ${surveyed.toLocaleString('vi-VN')} m² — ` +
          'có thể đã khớp sai địa danh, hoặc số khảo sát là diện tích xây dựng chứ không phải khuôn viên.',
      );
    }
  }

  return { ring: normalizeWinding(ring), areaM2, centroid: polygonCentroid(ring), errors, warnings };
}
