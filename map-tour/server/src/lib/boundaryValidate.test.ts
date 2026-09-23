import { describe, expect, it } from 'vitest';
import { isSelfIntersecting, openRing, validateRing, villageBoundsFrom } from './boundaryValidate.js';
import type { LatLng } from './geo.js';

// Vòng thật ở migrations/004_seed_sites.sql:12 và hộp bao thật của làng Ước Lễ
// (suy từ position của 21 site có toạ độ trong DB).
const RING: LatLng[] = [
  [20.826209, 105.810158],
  [20.826909, 105.810558],
  [20.826709, 105.811358],
  [20.825809, 105.811258],
  [20.825509, 105.810458],
];
const UOC_LE_SITE_POSITIONS: LatLng[] = [
  [20.823861, 105.809639],
  [20.827972, 105.813056],
];
const ctx = () => ({ villageBounds: villageBoundsFrom(UOC_LE_SITE_POSITIONS) });

/** Dịch cả vòng đi bấy nhiêu mét về phía bắc, để đẩy nó ra ngoài hộp bao làng. */
function shiftNorth(ring: LatLng[], metres: number): LatLng[] {
  return ring.map(([lat, lng]) => [lat + metres / 111_195.08, lng] as LatLng);
}

describe('openRing', () => {
  it('bỏ đỉnh đóng vòng của KML', () => {
    expect(openRing([...RING, RING[0]])).toEqual(RING);
  });

  it('bỏ đỉnh trùng liên tiếp', () => {
    expect(openRing([RING[0], RING[0], RING[1], RING[1], RING[2]])).toEqual([RING[0], RING[1], RING[2]]);
  });

  it('bỏ được cả trường hợp đỉnh đóng bị lặp nhiều lần', () => {
    expect(openRing([...RING, RING[0], RING[0]])).toEqual(RING);
  });

  it('không làm gì với vòng đã mở', () => {
    expect(openRing(RING)).toEqual(RING);
  });
});

describe('isSelfIntersecting', () => {
  it('nhận ra hình nơ (bowtie)', () => {
    const bowtie: LatLng[] = [[0, 0], [1, 1], [1, 0], [0, 1]];
    expect(isSelfIntersecting(bowtie)).toBe(true);
  });

  it('không báo động với hình lồi bình thường', () => {
    expect(isSelfIntersecting(RING)).toBe(false);
  });

  it('không báo động với hình lõm hợp lệ (chữ L)', () => {
    const lShape: LatLng[] = [[0, 0], [0, 3], [1, 3], [1, 1], [3, 1], [3, 0]];
    expect(isSelfIntersecting(lShape)).toBe(false);
  });

  it('tam giác không thể tự cắt', () => {
    expect(isSelfIntersecting([[0, 0], [1, 0], [0, 1]])).toBe(false);
  });
});

describe('validateRing — từ chối', () => {
  // Đây là test giá trị nhất cả bộ: đảo lat/lng là lỗi dễ xảy ra nhất khi dán
  // toạ độ từ GeoJSON hoặc KML, và nó âm thầm đặt cả làng sang châu lục khác.
  it('TỪ CHỐI vòng bị đảo thành [kinh độ, vĩ độ]', () => {
    const flipped = RING.map(([lat, lng]) => [lng, lat] as LatLng);
    const result = validateRing(flipped, ctx());
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('ngoài phạm vi toạ độ hợp lệ');
    expect(result.ring).toEqual([]);
  });

  it('từ chối vòng dưới 3 đỉnh phân biệt', () => {
    expect(validateRing([RING[0], RING[1]], ctx()).errors[0]).toContain('cần ít nhất 3');
    expect(validateRing([RING[0], RING[0], RING[0]], ctx()).errors[0]).toContain('cần ít nhất 3');
  });

  it('từ chối giá trị không hữu hạn', () => {
    const bad: LatLng[] = [[20.826, 105.81], [Number.NaN, 105.811], [20.827, 105.812]];
    expect(validateRing(bad, ctx()).errors[0]).toContain('không phải số hữu hạn');
  });

  it('từ chối vòng cách làng 4 km, nhưng NHẬN vòng lệch 300 m và 600 m', () => {
    expect(validateRing(shiftNorth(RING, 4000), ctx()).errors[0]).toContain('ngoài phạm vi làng');
    expect(validateRing(shiftNorth(RING, 300), ctx()).errors).toEqual([]);
    // 600 m: Chùa Sổ thật nằm 547 m ngoài hộp bao lõi Ước Lễ, nên mức này PHẢI đậu
    expect(validateRing(shiftNorth(RING, 600), ctx()).errors).toEqual([]);
  });

  it('từ chối vòng tự cắt', () => {
    const bowtie: LatLng[] = [RING[0], RING[2], RING[1], RING[3]];
    expect(validateRing(bowtie, ctx()).errors[0]).toContain('tự cắt');
  });

  it('từ chối diện tích trên 1 km²', () => {
    // Vuông 1 050 m (1 102 500 m²) đặt giữa làng: vừa NẰM TRONG hộp bao đã nới
    // (1 457 × 1 355 m) nên luật hộp bao không chạy, và test này chứng minh
    // đúng luật diện tích chứ không phải nhờ một luật khác chặn hộ.
    const huge: LatLng[] = [
      [20.821195, 105.806296],
      [20.830638, 105.806296],
      [20.830638, 105.816399],
      [20.821195, 105.816399],
    ];
    const result = validateRing(huge, ctx());
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('lớn hơn 1 km²');
    expect(result.ring).toEqual([]);
  });
});

describe('validateRing — nhận kèm cảnh báo', () => {
  it('nhận vòng seed mà không cảnh báo gì', () => {
    const result = validateRing(RING, ctx());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.areaM2).toBeCloseTo(13405.5, 0);
    expect(result.centroid?.[0]).toBeCloseTo(20.826231, 6);
  });

  it('cảnh báo khi diện tích dưới 10 m² (bấm lỡ tay)', () => {
    // ~3 x 3 m
    const tiny: LatLng[] = [
      [20.8262, 105.810100],
      [20.8262, 105.810129],
      [20.826227, 105.810129],
    ];
    const result = validateRing(tiny, ctx());
    expect(result.errors).toEqual([]);
    expect(result.areaM2).toBeLessThan(10);
    expect(result.warnings.join(' ')).toContain('bấm lỡ tay');
  });

  it('KHÔNG cảnh báo với nhà cổ / miếu nhỏ 18–50 m² — kích thước thật rất phổ biến', () => {
    // 30 m² = nhà truyền thống 5 x 6 m; đo được 11 hình như vậy trong KML thật
    const mPerDegLat = 111_195.08;
    const mPerDegLng = mPerDegLat * Math.cos(20.826 * (Math.PI / 180));
    const house: LatLng[] = [
      [20.8262, 105.8101],
      [20.8262 + 5 / mPerDegLat, 105.8101],
      [20.8262 + 5 / mPerDegLat, 105.8101 + 6 / mPerDegLng],
      [20.8262, 105.8101 + 6 / mPerDegLng],
    ];
    const result = validateRing(house, ctx());
    expect(result.areaM2).toBeCloseTo(30, 0);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('cảnh báo khi lệch quá 3× so với số khảo sát', () => {
    const bounds = villageBoundsFrom(UOC_LE_SITE_POSITIONS);
    // 13 405 m² so với 2 500 m² khảo sát = 5,4×
    const warned = validateRing(RING, { villageBounds: bounds, landAreaM2: 2500 });
    expect(warned.warnings.join(' ')).toContain('lệch');
    expect(warned.warnings.join(' ')).toContain('5.4×');
    // 13 405 so với 5 000 = 2,7× -> trong ngưỡng, không cảnh báo
    const quiet = validateRing(RING, { villageBounds: bounds, landAreaM2: 5000 });
    expect(quiet.warnings).toEqual([]);
  });

  it('không cảnh báo lệch khi site không có số khảo sát', () => {
    const bounds = villageBoundsFrom(UOC_LE_SITE_POSITIONS);
    expect(validateRing(RING, { villageBounds: bounds, landAreaM2: null }).warnings).toEqual([]);
  });

  it('chuẩn hoá chiều quay khi ghi', () => {
    const result = validateRing(RING, ctx());
    // RING là chiều kim đồng hồ (đã đo), nên kết quả phải là bản đảo ngược
    expect(result.ring).toEqual([...RING].reverse());
    expect(result.areaM2).toBeCloseTo(13405.5, 0);
  });

  it('bỏ đỉnh đóng vòng trước khi tính', () => {
    const result = validateRing([...RING, RING[0]], ctx());
    expect(result.ring).toHaveLength(RING.length);
    expect(result.errors).toEqual([]);
  });
});

describe('villageBoundsFrom', () => {
  it('nới hộp bao ra 1 500 m mỗi phía cho làng có nhiều điểm', () => {
    const bounds = villageBoundsFrom(UOC_LE_SITE_POSITIONS);
    const padLatM = (20.823861 - bounds.south) * 111_195.08;
    expect(padLatM).toBeCloseTo(1500, -1);
  });

  it('làng chỉ có 1 site: hộp bao suy biến vẫn nới đủ để nhận vòng hợp lý', () => {
    const bounds = villageBoundsFrom([[20.8265, 105.8108]]);
    // hộp bao rộng ít nhất 3 km, nên vòng quanh chính điểm đó phải đậu
    const result = validateRing(RING, { villageBounds: bounds });
    expect(result.errors).toEqual([]);
    // Đúng bằng sàn 3 km (lệch ~1e-10 do dấu phẩy động, nên không dùng >=).
    const spanLatM = (bounds.north - bounds.south) * 111_195.08;
    expect(spanLatM).toBeCloseTo(3000, 6);
  });
});
