// Maps database site rows to the public TourSite API payload.
// See src/types.ts for the matching frontend definition.

import { areaSquareMeters, estimatedRadiusMeters, MIN_RING_VERTICES, spanMeters, type LatLng } from './geo.js';

export interface SiteRow {
  id: string;
  kind: 'point' | 'area';
  name: string;
  category: string;
  short_description: string | null;
  village_name: string;
  position_lat: number | null;
  position_lng: number | null;
  boundary: LatLng[] | null;
  panorama_url: string | null;
  panorama_attribution: string | null;
  cover_url: string | null;
  cover_attribution: string | null;
  land_area_m2?: number | null;
}

export function toTourSite(row: SiteRow) {
  const hasBoundary = Array.isArray(row.boundary) && row.boundary.length >= MIN_RING_VERTICES;
  const boundary = hasBoundary ? (row.boundary as LatLng[]) : undefined;
  const areaM2 = boundary ? areaSquareMeters(boundary) : undefined;
  const spanM = boundary ? spanMeters(boundary) : undefined;
  const landAreaM2 = row.land_area_m2 ?? null;
  const estimatedRadiusM = estimatedRadiusMeters(landAreaM2);

  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    category: row.category,
    description: row.short_description ?? '',
    village: row.village_name,
    position: [row.position_lat ?? 0, row.position_lng ?? 0] as LatLng,
    ...(boundary ? { boundary } : {}),
    ...(areaM2 !== undefined ? { areaM2 } : {}),
    ...(spanM ? { spanM } : {}),
    ...(estimatedRadiusM !== null ? { estimatedRadiusM } : {}),
    ...(landAreaM2 !== null ? { landAreaM2 } : {}),
    panorama: row.panorama_url
      ? { url: row.panorama_url, attribution: row.panorama_attribution ?? undefined }
      : undefined,
    cover: row.cover_url
      ? { url: row.cover_url, attribution: row.cover_attribution ?? undefined }
      : undefined,
  };
}
