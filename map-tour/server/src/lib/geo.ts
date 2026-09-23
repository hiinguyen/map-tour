// Hình học thuần cho ranh giới site. Bản CHÍNH duy nhất của các phép toán này:
// frontend KHÔNG cài lại chúng, mà tiêu thụ areaM2 / spanM / estimatedRadiusM
// đã tính sẵn trong payload API (xem toTourSite ở lib/siteMapper.ts).
//
// File này không import pg/env nên test được mà không cần database.
//
// QUY ƯỚC TRỤC: ring là [lat, lng] — thứ tự app dùng khi lưu sites.boundary
// (đối lập với GeoJSON/MapLibre là [lng, lat]). Mọi công thức dưới đây chiếu
// sang (x = lng, y = lat) trước khi tính, nên đừng đảo thứ tự khi sửa: dấu của
// tổng shoelace sẽ lật và normalizeWinding() sẽ quay ngược vòng.

/** Một đỉnh, theo thứ tự [lat, lng]. */
export type LatLng = [number, number];

/** Hộp bao, dạng object thuần — không phải LngLatBounds, để file này không
 *  phụ thuộc MapLibre và chạy được trong môi trường node của vitest. */
export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface Span {
  /** Bề ngang hộp bao, mét. */
  width: number;
  /** Bề cao hộp bao, mét. */
  height: number;
}

// Bán kính trung bình WGS84. Suy ra 1 độ vĩ = R·π/180 = 111 195,08 m.
//
// CẢNH BÁO CHO NGƯỜI VIẾT TEST: khi dựng một hình vuông "n × n mét" để kiểm
// areaSquareMeters, phải đổi mét sang độ bằng CHÍNH hằng số này. Dùng con số
// 111 320 m/độ quen thuộc sẽ cho hình vuông lệch 0,112% mỗi chiều, tức diện
// tích lệch 0,224% — và test sẽ đỏ vì hình thử sai, không phải vì hàm sai.
const EARTH_RADIUS_M = 6371008.8;
const DEG_TO_RAD = Math.PI / 180;

/** Số đỉnh phân biệt tối thiểu để một vòng có diện tích. */
export const MIN_RING_VERTICES = 3;

/**
 * Diện tích vòng, mét vuông, luôn dương.
 *
 * Chiếu equirectangular cục bộ quanh vĩ độ trung bình của chính vòng đó
 * (x = R·λ·cos φ₀, y = R·φ) rồi lấy tổng shoelace. Sai số đã đo tại 20,83°N:
 * vuông 50 m → −1,5e−4 %; 100 m → −3,0e−4 %; 1 km → −3,0e−3 %. Sai số tăng
 * theo (Δφ)² nên với footprint dưới 1 km luôn dưới 0,01% — trong khi một đỉnh
 * vẽ tay trên ảnh vệ tinh sai ±1–3 m, tức vài PHẦN TRĂM trên một toà nhà rộng
 * 30 m. Vì thế @turf/area (spherical excess) không đổi được con số in ra và
 * không đáng thêm một dependency.
 *
 * Trả giá trị tuyệt đối: chiều quay từ Google My Maps không được đảm bảo.
 *
 * Vĩ độ quy chiếu φ₀ lấy ở GIỮA HỘP BAO, không phải trung bình các đỉnh. Nhờ
 * vậy diện tích bất biến với cả thứ tự đỉnh lẫn đỉnh lặp — quan trọng vì vòng
 * LinearRing của KML vốn đến ở dạng ĐÃ KHÉP (đỉnh đầu lặp ở cuối). Nếu dùng
 * trung bình đỉnh, đỉnh đầu bị đếm hai lần sẽ kéo φ₀ lệch và cùng một hình cho
 * hai con số khác nhau (đã đo: chênh 3,9e-3 m² trên vòng 13 405 m²).
 */
export function areaSquareMeters(ring: LatLng[]): number {
  if (ring.length < MIN_RING_VERTICES) return 0;

  const { south, north } = boundsOf(ring);
  const cosPhi0 = Math.cos(((south + north) / 2) * DEG_TO_RAD);
  const kx = EARTH_RADIUS_M * DEG_TO_RAD * cosPhi0;
  const ky = EARTH_RADIUS_M * DEG_TO_RAD;

  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lat1, lng1] = ring[i];
    const [lat2, lng2] = ring[(i + 1) % ring.length];
    sum += lng1 * kx * (lat2 * ky) - lng2 * kx * (lat1 * ky);
  }
  return Math.abs(sum) / 2;
}

/** Hộp bao của vòng. Không phụ thuộc thứ tự đỉnh. */
export function boundsOf(ring: LatLng[]): Bounds {
  let south = Infinity;
  let north = -Infinity;
  let west = Infinity;
  let east = -Infinity;
  for (const [lat, lng] of ring) {
    if (lat < south) south = lat;
    if (lat > north) north = lat;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  }
  return { south, west, north, east };
}

/**
 * Bề ngang/bề cao hộp bao, tính bằng mét — chỉ dùng cho câu chữ mô tả
 * ("≈ 141 × 118 m"), không dùng cho phép đo chính xác.
 */
export function spanMeters(ring: LatLng[]): Span {
  if (ring.length === 0) return { width: 0, height: 0 };
  const { south, west, north, east } = boundsOf(ring);
  const cosPhi0 = Math.cos(((south + north) / 2) * DEG_TO_RAD);
  return {
    width: (east - west) * DEG_TO_RAD * EARTH_RADIUS_M * cosPhi0,
    height: (north - south) * DEG_TO_RAD * EARTH_RADIUS_M,
  };
}

/**
 * Trọng tâm vòng, có trọng số theo diện tích — chuyển từ src/types.ts
 * (polygonCentroid), thuật toán giữ nguyên từng dòng.
 *
 * Dùng trọng tâm theo diện tích chứ không phải trung bình các đỉnh, để marker
 * rơi vào tâm THỊ GIÁC của hình thay vì bị kéo lệch về phía nào có nhiều đỉnh
 * hơn. Vòng suy biến (diện tích 0) rơi về trung bình đỉnh.
 *
 * Hai giá trị mà hàm này trả cho hai vòng seed ở migrations/004_seed_sites.sql
 * đã được hardcode vào migrations/015_sites_position_and_footprint.sql; test
 * geo.test.ts canh đúng cặp số đó, nên sửa hàm mà quên sửa migration sẽ đỏ test.
 */
export function polygonCentroid(ring: LatLng[]): LatLng {
  let area = 0;
  let centroidLat = 0;
  let centroidLng = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lat1, lng1] = ring[i];
    const [lat2, lng2] = ring[(i + 1) % ring.length];
    const cross = lng1 * lat2 - lng2 * lat1;
    area += cross;
    centroidLng += (lng1 + lng2) * cross;
    centroidLat += (lat1 + lat2) * cross;
  }
  area /= 2;
  if (area === 0) {
    let latSum = 0;
    let lngSum = 0;
    for (const [lat, lng] of ring) {
      latSum += lat;
      lngSum += lng;
    }
    return [latSum / ring.length, lngSum / ring.length];
  }
  return [centroidLat / (6 * area), centroidLng / (6 * area)];
}

/**
 * Bán kính, mét, của vòng tròn bao đúng diện tích khảo sát đã ghi nhận:
 * r = √(A/π). Trả null khi không có số khảo sát.
 *
 * KHÔNG có bảng bán kính mặc định theo category, và đó là chủ ý: site không có
 * căn cứ diện tích nào thì bản đồ khoá KHÔNG vẽ vòng phỏng đoán nào cả. Một
 * bán kính bịa ra với đường nét đứt tự tin còn tệ hơn là không có gì.
 */
export function estimatedRadiusMeters(landAreaM2: number | null | undefined): number | null {
  if (landAreaM2 === null || landAreaM2 === undefined) return null;
  if (!Number.isFinite(landAreaM2) || landAreaM2 <= 0) return null;
  return Math.sqrt(landAreaM2 / Math.PI);
}

/**
 * Chuẩn hoá vòng về chiều NGƯỢC kim đồng hồ trong hệ (x = lng, y = lat) —
 * tức chiều mà RFC 7946 quy định cho vòng ngoài của GeoJSON Polygon.
 *
 * MapLibre chấp nhận cả hai chiều nên việc này không đổi hiển thị hôm nay;
 * nó tồn tại để một bước PostGIS/turf sau này không phải đoán. Vòng được chuẩn
 * hoá lúc GHI, không bao giờ bị từ chối vì chiều quay.
 */
export function normalizeWinding(ring: LatLng[]): LatLng[] {
  if (ring.length < MIN_RING_VERTICES) return ring;
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lat1, lng1] = ring[i];
    const [lat2, lng2] = ring[(i + 1) % ring.length];
    sum += lng1 * lat2 - lng2 * lat1;
  }
  // sum > 0 đã là ngược kim đồng hồ; đảo lại khi âm.
  return sum >= 0 ? ring : [...ring].reverse();
}

/**
 * Kiểm tra điểm point [lat, lng] có nằm trong vòng polygon ring hay không (Ray-Casting).
 */
export function isPointInPolygon(point: LatLng, ring: LatLng[]): boolean {
  if (ring.length < MIN_RING_VERTICES) return false;
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    const intersect =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Khoảng cách xấp xỉ giữa hai điểm toạ độ, tính bằng mét.
 */
export function distanceMeters(p1: LatLng, p2: LatLng): number {
  const midLat = (p1[0] + p2[0]) / 2;
  const cosPhi0 = Math.cos(midLat * DEG_TO_RAD);
  const dLat = (p2[0] - p1[0]) * DEG_TO_RAD * EARTH_RADIUS_M;
  const dLng = (p2[1] - p1[1]) * DEG_TO_RAD * EARTH_RADIUS_M * cosPhi0;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

