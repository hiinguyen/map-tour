import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LatLng, TourSite } from '../../types';
import { toLngLat } from '../../types';
import { footprintOf } from '../geo';
import { MAP_COLORS } from '../mapColors';

/**
 * Khep vong toan ven [lng, lat] tu danh sach [lat, lng].
 * Guard cho vong rong: tra mieu mui [] va khong throw.
 */
export function closedRing(boundary: LatLng[] | undefined | null): [number, number][] {
  if (!boundary || boundary.length === 0) return [];
  const ring = boundary.map(toLngLat);
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    ring.push(ring[0]);
  }
  return ring;
}

/**
 * Tong quat hoa danh sach site sang GeoJSON FeatureCollection cho footprint layers.
 */
export function footprintFeatureCollection(sites: TourSite[]): GeoJSON.FeatureCollection {
  const footprintSites = sites.filter((site) => footprintOf(site) !== null);
  return {
    type: 'FeatureCollection',
    features: footprintSites.map((site) => ({
      type: 'Feature',
      properties: {
        id: site.id,
        name: site.name,
        description: site.description,
        areaM2: site.areaM2,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [closedRing(site.boundary)],
      },
    })),
  };
}

/**
 * Dang ky hinh pattern gach cheo footprint-hatch tren canvas map.
 */
export function ensureHatchImage(map: MapLibreMap): boolean {
  if (map.hasImage('footprint-hatch')) return true;
  try {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.strokeStyle = MAP_COLORS.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.moveTo(-size / 2, size / 2);
    ctx.lineTo(size / 2, -size / 2);
    ctx.moveTo(size / 2, size * 1.5);
    ctx.lineTo(size * 1.5, size / 2);
    ctx.stroke();

    const imageData = ctx.getImageData(0, 0, size, size);
    map.addImage('footprint-hatch', imageData);
    return true;
  } catch (error) {
    console.warn('Failed to add hatch pattern image to map:', error);
    return false;
  }
}

/**
 * Them 5 layer hien thi ranh gioi son ta chi vang theo dung thiet ke T5.
 */
export function addFootprintLayers(map: MapLibreMap, sourceId: string): void {
  // 1. Halo bóng mờ
  if (!map.getLayer('tour-areas-halo')) {
    map.addLayer({
      id: 'tour-areas-halo',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': MAP_COLORS.shadowInk,
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 4, 18, 10],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 14, 3, 18, 8],
        'line-offset': ['interpolate', ['linear'], ['zoom'], 14, 3, 18, 7],
      },
    });
  }

  // 2. Lớp phủ tô nhạt
  if (!map.getLayer('tour-areas-fill')) {
    map.addLayer({
      id: 'tour-areas-fill',
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': MAP_COLORS.primary,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.09, 17, 0.15],
      },
    });
  }

  // 3. Gạch chéo vàng (chỉ thêm khi hatch image sẵn sàng)
  const hasHatch = ensureHatchImage(map);
  if (hasHatch && !map.getLayer('tour-areas-hatch')) {
    map.addLayer({
      id: 'tour-areas-hatch',
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-pattern': 'footprint-hatch',
        'fill-opacity': 0.55,
      },
    });
  }

  // 4. Viền ranh giới chính
  if (!map.getLayer('tour-areas-line')) {
    map.addLayer({
      id: 'tour-areas-line',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': MAP_COLORS.primary,
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.6, 17, 3, 19, 4.5],
      },
    });
  }

  // 5. Chỉ vàng sắc nét
  if (!map.getLayer('tour-areas-hairline')) {
    map.addLayer({
      id: 'tour-areas-hairline',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': MAP_COLORS.gold,
        'line-width': 1,
        'line-offset': -3,
      },
    });
  }
}

/**
 * Them 2 layer cho pham vi phongs doan (nét đứt) theo T6.
 */
export function addEstimatedCircleLayers(map: MapLibreMap, sourceId: string): void {
  if (!map.getLayer('tour-estimate-fill')) {
    map.addLayer({
      id: 'tour-estimate-fill',
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': MAP_COLORS.primary,
        'fill-opacity': 0.05,
      },
    });
  }

  if (!map.getLayer('tour-estimate-line')) {
    map.addLayer({
      id: 'tour-estimate-line',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': MAP_COLORS.primary,
        'line-width': 2,
        'line-opacity': 0.55,
        'line-dasharray': [2, 2.5],
      },
    });
  }
}
