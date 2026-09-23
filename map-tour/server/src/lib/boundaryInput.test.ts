import { describe, expect, it } from 'vitest';
import { formatBoundaryInput, parseBoundaryInput } from './boundaryInput.js';
import { validateRing, villageBoundsFrom } from './boundaryValidate.js';
import { areaSquareMeters, polygonCentroid, type LatLng } from './geo.js';

// Khối <coordinates> THẬT, lấy nguyên văn từ placemark 'Đình' trong map Google
// My Maps của làng Ước Lễ (mid=1FSfpZVwnCOeQQ77lkjT_zfsOGrOTNps). Giữ đúng
// newline + thụt lề 16 dấu cách + thành phần độ cao ",0" + đỉnh đầu lặp ở cuối,
// vì đó chính là những thứ dễ làm vỡ bộ đọc.
const REAL_KML_COORDINATES = `
                105.8100688,20.8275851,0
                105.8099682,20.8274949,0
                105.8097844,20.8271878,0
                105.8099414,20.8270887,0
                105.8101761,20.827011,0
                105.8102351,20.826996,0
                105.8104402,20.8272692,0
                105.8102101,20.8274722,0
                105.8100688,20.8275851,0
              `;

const RING: LatLng[] = [
  [20.826209, 105.810158],
  [20.826909, 105.810558],
  [20.826709, 105.811358],
  [20.825809, 105.811258],
  [20.825509, 105.810458],
];

describe('parseBoundaryInput — khối <coordinates> của KML', () => {
  it('đọc được khối thật, đổi lng,lat -> lat,lng và bỏ độ cao', () => {
    const result = parseBoundaryInput(REAL_KML_COORDINATES);
    expect(result.errors).toEqual([]);
    expect(result.format).toBe('kml-coordinates');
    // 9 tuple, đỉnh cuối trùng đỉnh đầu — parse giữ nguyên cả 9, openRing() mới bỏ
    expect(result.ring).toHaveLength(9);
    expect(result.ring[0]).toEqual([20.8275851, 105.8100688]);
    expect(result.ring[8]).toEqual([20.8275851, 105.8100688]);
    // vĩ độ phải quanh 20.8, kinh độ quanh 105.8 — không bị đảo
    for (const [lat, lng] of result.ring) {
      expect(lat).toBeGreaterThan(20);
      expect(lat).toBeLessThan(21);
      expect(lng).toBeGreaterThan(105);
      expect(lng).toBeLessThan(106);
    }
  });

  it('cho cùng kết quả dù phân cách bằng dấu cách, tab hay newline', () => {
    const oneLine = REAL_KML_COORDINATES.trim().split(/\s+/).join(' ');
    const tabbed = REAL_KML_COORDINATES.trim().split(/\s+/).join('\t');
    const base = parseBoundaryInput(REAL_KML_COORDINATES).ring;
    expect(parseBoundaryInput(oneLine).ring).toEqual(base);
    expect(parseBoundaryInput(tabbed).ring).toEqual(base);
  });

  it('nhận cả tuple 2 thành phần (không có độ cao)', () => {
    const noAltitude = REAL_KML_COORDINATES.trim()
      .split(/\s+/)
      .map((t) => t.split(',').slice(0, 2).join(','))
      .join(' ');
    expect(parseBoundaryInput(noAltitude).ring).toEqual(parseBoundaryInput(REAL_KML_COORDINATES).ring);
  });

  it('đi hết đường tới validateRing và ra diện tích hợp lý cho sân đình', () => {
    const parsed = parseBoundaryInput(REAL_KML_COORDINATES);
    const result = validateRing(parsed.ring, {
      villageBounds: villageBoundsFrom([
        [20.823861, 105.809639],
        [20.827972, 105.813056],
      ]),
    });
    expect(result.errors).toEqual([]);
    // Khuôn viên đình làng Ước Lễ: khảo sát ghi 2 500 m²
    expect(result.areaM2).toBeGreaterThan(500);
    expect(result.areaM2).toBeLessThan(5000);
    // Trọng tâm phải rơi gần ghim 'Đình làng Ước Lễ' trong DB (20.827225, 105.810244)
    expect(result.centroid?.[0]).toBeCloseTo(20.8273, 3);
    expect(result.centroid?.[1]).toBeCloseTo(105.8101, 3);
  });
});

describe('parseBoundaryInput — GeoJSON', () => {
  const coords = RING.map(([lat, lng]) => [lng, lat]);

  it('đọc Polygon, Feature và FeatureCollection 1 feature ra cùng một vòng', () => {
    const polygon = JSON.stringify({ type: 'Polygon', coordinates: [coords] });
    const feature = JSON.stringify({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } });
    const collection = JSON.stringify({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }],
    });
    expect(parseBoundaryInput(polygon).ring).toEqual(RING);
    expect(parseBoundaryInput(feature).ring).toEqual(RING);
    expect(parseBoundaryInput(collection).ring).toEqual(RING);
    expect(parseBoundaryInput(polygon).format).toBe('geojson');
  });

  it('từ chối Polygon có lỗ, nêu rõ lý do', () => {
    const withHole = JSON.stringify({ type: 'Polygon', coordinates: [coords, coords] });
    const result = parseBoundaryInput(withHole);
    expect(result.ring).toEqual([]);
    expect(result.errors[0]).toContain('không biểu diễn được lỗ');
  });

  it('từ chối MultiPolygon, nêu rõ lý do', () => {
    const multi = JSON.stringify({ type: 'MultiPolygon', coordinates: [[coords]] });
    expect(parseBoundaryInput(multi).errors[0]).toContain('nhiều mảnh rời');
  });

  it('từ chối FeatureCollection nhiều feature', () => {
    const f = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } };
    const many = JSON.stringify({ type: 'FeatureCollection', features: [f, f] });
    expect(parseBoundaryInput(many).errors[0]).toContain('2 feature');
  });

  it('từ chối LineString', () => {
    const line = JSON.stringify({ type: 'LineString', coordinates: coords });
    expect(parseBoundaryInput(line).errors[0]).toContain('cần Polygon');
  });
});

describe('parseBoundaryInput — định dạng của app', () => {
  it('round-trip byte-identical qua formatBoundaryInput', () => {
    const text = formatBoundaryInput(RING);
    const result = parseBoundaryInput(text);
    expect(result.format).toBe('app');
    expect(result.ring).toEqual(RING);
    expect(formatBoundaryInput(result.ring)).toBe(text);
  });

  it('giữ nguyên thứ tự [vĩ độ, kinh độ], KHÔNG đảo trục', () => {
    const result = parseBoundaryInput('[[20.826209, 105.810158], [20.826909, 105.810558], [20.826709, 105.811358]]');
    expect(result.ring[0]).toEqual([20.826209, 105.810158]);
  });
});

describe('parseBoundaryInput — thông báo lỗi phân biệt được', () => {
  it('ô rỗng', () => {
    expect(parseBoundaryInput('').errors[0]).toContain('Chưa dán');
    expect(parseBoundaryInput('   \n  ').errors[0]).toContain('Chưa dán');
  });

  it('chữ vô nghĩa nêu ra được cả ba dạng chấp nhận', () => {
    const result = parseBoundaryInput('abc');
    expect(result.errors[0]).toContain('Không nhận ra định dạng');
    expect(result.errors[0]).toContain('GeoJSON');
    expect(result.errors[0]).toContain('<coordinates>');
  });

  it('JSON rỗng {} khác với JSON vỡ', () => {
    expect(parseBoundaryInput('{}').errors[0]).toContain('Không tìm thấy hình học');
    expect(parseBoundaryInput('{"type":').errors[0]).toContain('Không đọc được JSON');
  });

  it('mảng nhưng đỉnh sai dạng', () => {
    expect(parseBoundaryInput('[1, 2, 3]').errors[0]).toContain('không đúng dạng');
    expect(parseBoundaryInput('[["a","b"]]').errors[0]).toContain('không phải số');
  });
});

describe('cả ba dạng cho CÙNG một vòng khi mô tả cùng một hình', () => {
  it('GeoJSON, định dạng app và khối KML trùng khớp', () => {
    const coords = RING.map(([lat, lng]) => [lng, lat]);
    const fromGeoJson = parseBoundaryInput(JSON.stringify({ type: 'Polygon', coordinates: [coords] })).ring;
    const fromApp = parseBoundaryInput(formatBoundaryInput(RING)).ring;
    const fromKml = parseBoundaryInput(coords.map(([lng, lat]) => `${lng},${lat},0`).join('\n  ')).ring;
    expect(fromGeoJson).toEqual(RING);
    expect(fromApp).toEqual(RING);
    expect(fromKml).toEqual(RING);
    // và cho cùng diện tích + trọng tâm
    expect(areaSquareMeters(fromKml)).toBe(areaSquareMeters(RING));
    expect(polygonCentroid(fromKml)).toEqual(polygonCentroid(RING));
  });
});
