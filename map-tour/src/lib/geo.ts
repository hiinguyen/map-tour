import type { LatLng, TourSite } from '../types';

/**
 * Tra ve ranh gioi hop le (tu 3 dinh tro len) hoac null if missing/corrupt.
 * Day la diem guard duy nhat cho du lieu ranh gioi o frontend.
 */
export function footprintOf(site: TourSite): LatLng[] | null {
  if (site.boundary && site.boundary.length >= 3) {
    return site.boundary;
  }
  return null;
}

/**
 * Trọng tâm hình học của ranh giới (trung bình số học các đỉnh).
 * Nếu site không có ranh giới hợp lệ, trả về position gốc.
 */
export function footprintCenter(site: TourSite): LatLng {
  const boundary = site.boundary;
  if (!boundary || boundary.length < 3) return site.position;
  let sumLat = 0;
  let sumLng = 0;
  for (const [lat, lng] of boundary) {
    sumLat += lat;
    sumLng += lng;
  }
  return [sumLat / boundary.length, sumLng / boundary.length];
}

/**
 * Dinh dang dien tich theo format Tieng Viet (vi-VN).
 * Vi du: 13405.5 -> "13.406 m²" hoac Math.round -> "13.406 m²"
 */
export function formatAreaM2(m2: number): string {
  return `${Math.round(m2).toLocaleString('vi-VN')} m²`;
}

/**
 * Sinh chuoi dinh polygon vong tron quanh mot diem theo ban kinh (met).
 */
export function circlePolygon(center: LatLng, radiusMeters: number, vertices: number = 64): LatLng[] {
  const [lat, lng] = center;
  const delta = radiusMeters / 6378137;
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  const ring: LatLng[] = [];

  for (let i = 0; i < vertices; i++) {
    const theta = (i * 2 * Math.PI) / vertices;
    const latI = lat + delta * Math.cos(theta) * (180 / Math.PI);
    const lngI = lng + (delta * Math.sin(theta) * (180 / Math.PI)) / cosLat;
    ring.push([latI, lngI]);
  }

  return ring;
}
