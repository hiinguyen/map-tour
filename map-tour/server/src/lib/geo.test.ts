import { describe, expect, it } from 'vitest';
import {
  areaSquareMeters,
  boundsOf,
  distanceMeters,
  estimatedRadiusMeters,
  isPointInPolygon,
  normalizeWinding,
  polygonCentroid,
  spanMeters,
  type LatLng,
} from './geo.js';


// Hai vòng thật trong migrations/004_seed_sites.sql:12-13 (làng Ước Lễ).
// Lưu dạng vòng MỞ: đỉnh đầu không lặp lại ở cuối.
const RING_KHU_LANG_CO: LatLng[] = [
  [20.826209, 105.810158],
  [20.826909, 105.810558],
  [20.826709, 105.811358],
  [20.825809, 105.811258],
  [20.825509, 105.810458],
];
const RING_LANG_NGHE: LatLng[] = [
  [20.824609, 105.811058],
  [20.825009, 105.811658],
  [20.824409, 105.812158],
  [20.823909, 105.811558],
];

// Dựng hình vuông "side × side mét" quanh một vĩ độ.
//
// PHẢI đổi mét sang độ bằng CHÍNH hằng số Trái Đất mà geo.ts dùng
// (R = 6371008.8 -> 1 độ vĩ = 111 195,08 m). Dùng con số 111 320 m/độ quen
// thuộc sẽ cho hình vuông nhỏ hơn 0,112% mỗi chiều, tức diện tích lệch
// -0,224% (10 000 -> 9 977,5) và test sẽ đỏ vì HÌNH THỬ sai, không phải vì
// areaSquareMeters sai. Đã mắc đúng bẫy này một lần khi dựng kế hoạch.
const M_PER_DEG_LAT = 6371008.8 * (Math.PI / 180);
function squareRing(lat: number, side: number): LatLng[] {
  const dLat = side / M_PER_DEG_LAT;
  const dLng = side / (M_PER_DEG_LAT * Math.cos(lat * (Math.PI / 180)));
  return [
    [lat, 0],
    [lat + dLat, 0],
    [lat + dLat, dLng],
    [lat, dLng],
  ];
}

describe('areaSquareMeters', () => {
  it('trả diện tích đúng cho hình vuông 100x100m ở vĩ độ của làng', () => {
    expect(areaSquareMeters(squareRing(20.83, 100))).toBeCloseTo(9999.97, 1);
  });

  it('giữ sai số dưới 0,01% từ cỡ 50m đến cỡ 1km', () => {
    for (const side of [50, 100, 300, 1000]) {
      const relativeError = Math.abs(areaSquareMeters(squareRing(20.83, side)) / (side * side) - 1);
      expect(relativeError).toBeLessThan(0.0001);
    }
  });

  it('khớp diện tích hai vòng seed thật', () => {
    expect(areaSquareMeters(RING_KHU_LANG_CO)).toBeCloseTo(13405.5, 0);
    expect(areaSquareMeters(RING_LANG_NGHE)).toBeCloseTo(7107.3, 0);
  });

  it('không phụ thuộc chiều quay của vòng', () => {
    const reversed = [...RING_KHU_LANG_CO].reverse();
    expect(areaSquareMeters(reversed)).toBeCloseTo(areaSquareMeters(RING_KHU_LANG_CO), 6);
  });

  it('cho diện tích Y HỆT khi vòng ở dạng đã khép — vòng KML luôn đến như vậy', () => {
    const closed: LatLng[] = [...RING_KHU_LANG_CO, RING_KHU_LANG_CO[0]];
    // Bằng tuyệt đối, không phải "gần bằng": φ₀ lấy ở giữa hộp bao nên đỉnh
    // lặp không kéo được vĩ độ quy chiếu đi đâu.
    expect(areaSquareMeters(closed)).toBe(areaSquareMeters(RING_KHU_LANG_CO));
  });

  it('trả 0 cho vòng suy biến', () => {
    expect(areaSquareMeters([])).toBe(0);
    expect(areaSquareMeters([[20.82, 105.81]])).toBe(0);
    expect(areaSquareMeters([[20.82, 105.81], [20.83, 105.82]])).toBe(0);
    // Ba điểm thẳng hàng: về toán học là 0, nhưng shoelace trên toạ độ cỡ 105
    // nhân hệ số cỡ 1e5 để lại dư số dấu phẩy động ~2e-3 m². Khẳng định "nhỏ
    // đến mức vô nghĩa" thay vì đúng bằng 0 — chính xác hơn về mặt mô tả.
    const collinearArea = areaSquareMeters([[20.82, 105.81], [20.83, 105.82], [20.84, 105.83]]);
    expect(collinearArea).toBeLessThan(0.01);
  });
});

describe('polygonCentroid', () => {
  // Hai kỳ vọng dưới đây là ĐÚNG hai cặp số đã hardcode vào
  // migrations/015_sites_position_and_footprint.sql. Sửa hàm mà quên sửa
  // migration (hoặc ngược lại) thì test này đỏ — đó là mục đích của nó.
  it('khớp giá trị đã backfill vào migration 015', () => {
    const [lat1, lng1] = polygonCentroid(RING_KHU_LANG_CO);
    expect(lat1).toBeCloseTo(20.826231, 6);
    expect(lng1).toBeCloseTo(105.810776, 6);

    const [lat2, lng2] = polygonCentroid(RING_LANG_NGHE);
    expect(lat2).toBeCloseTo(20.82448, 6);
    expect(lng2).toBeCloseTo(105.811627, 6);
  });

  it('rơi về trung bình đỉnh khi vòng suy biến (diện tích 0)', () => {
    const collinear: LatLng[] = [[20.0, 105.0], [21.0, 105.0], [22.0, 105.0]];
    expect(polygonCentroid(collinear)).toEqual([21, 105]);
  });
});

describe('boundsOf', () => {
  it('trả hộp bao không phụ thuộc thứ tự đỉnh', () => {
    const expected = { south: 20.825509, west: 105.810158, north: 20.826909, east: 105.811358 };
    expect(boundsOf(RING_KHU_LANG_CO)).toEqual(expected);
    expect(boundsOf([...RING_KHU_LANG_CO].reverse())).toEqual(expected);
  });
});

describe('spanMeters', () => {
  it('trả bề ngang/bề cao hợp lý cho vòng seed', () => {
    const { width, height } = spanMeters(RING_KHU_LANG_CO);
    // 0,0012 độ kinh tại 20,83N ~ 125m; 0,0014 độ vĩ ~ 156m
    expect(width).toBeCloseTo(124.7, 0);
    expect(height).toBeCloseTo(155.7, 0);
  });

  it('trả 0 cho vòng rỗng thay vì NaN', () => {
    expect(spanMeters([])).toEqual({ width: 0, height: 0 });
  });
});

describe('estimatedRadiusMeters', () => {
  it('trả bán kính vòng tròn bao đúng diện tích khảo sát', () => {
    // Đình làng Ước Lễ: 2500 m² -> 28,2 m; Chùa Sổ: 5000 m² -> 39,9 m
    expect(estimatedRadiusMeters(2500)).toBeCloseTo(28.21, 2);
    expect(estimatedRadiusMeters(5000)).toBeCloseTo(39.89, 2);
  });

  it('trả null khi KHÔNG có căn cứ diện tích — không bịa bán kính mặc định', () => {
    expect(estimatedRadiusMeters(null)).toBeNull();
    expect(estimatedRadiusMeters(undefined)).toBeNull();
    expect(estimatedRadiusMeters(0)).toBeNull();
    expect(estimatedRadiusMeters(-5)).toBeNull();
    expect(estimatedRadiusMeters(Number.NaN)).toBeNull();
  });
});

describe('normalizeWinding', () => {
  // Đã đo: CẢ HAI vòng seed trong 004_seed_sites.sql đều THEO chiều kim đồng hồ
  // (tổng shoelace trong hệ x=lng,y=lat là -2,32e-6 và -1,23e-6). Nên chính
  // RING_KHU_LANG_CO là đầu vào "cần quay", còn bản đảo ngược của nó mới là
  // dạng chuẩn RFC 7946.
  const CCW = [...RING_KHU_LANG_CO].reverse();

  it('quay vòng theo chiều kim đồng hồ về ngược kim đồng hồ', () => {
    expect(normalizeWinding(RING_KHU_LANG_CO)).toEqual(CCW);
  });

  it('để nguyên vòng đã ngược kim đồng hồ', () => {
    expect(normalizeWinding(CCW)).toEqual(CCW);
  });

  it('là hàm luỹ đẳng', () => {
    expect(normalizeWinding(normalizeWinding(RING_KHU_LANG_CO))).toEqual(CCW);
  });

  it('bảo toàn diện tích', () => {
    expect(areaSquareMeters(normalizeWinding(RING_KHU_LANG_CO))).toBe(
      areaSquareMeters(RING_KHU_LANG_CO),
    );
  });

  it('để nguyên vòng quá ngắn', () => {
    const short: LatLng[] = [[20.82, 105.81], [20.83, 105.82]];
    expect(normalizeWinding(short)).toEqual(short);
  });
});

describe('isPointInPolygon & distanceMeters', () => {
  it('kiểm tra điểm nằm trong và ngoài polygon', () => {
    const centroid = polygonCentroid(RING_KHU_LANG_CO);
    expect(isPointInPolygon(centroid, RING_KHU_LANG_CO)).toBe(true);
    expect(isPointInPolygon([20.0, 105.0], RING_KHU_LANG_CO)).toBe(false);
  });

  it('tính khoảng cách mét giữa hai điểm', () => {
    const p1: LatLng = [20.826209, 105.810158];
    const p2: LatLng = [20.826909, 105.810558];
    const dist = distanceMeters(p1, p2);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(150);
  });
});

