export interface Village {
  id: string;
  slug: string;
  name: string;
  adminLocation: string | null;
  mainOccupations: string[];
  foundedPeriod: string | null;
  coverUrl: string | null;
}

export type LatLng = [number, number]; // [lat, lng]

// GeoJSON/OSRM/MapLibre all expect [lng, lat] — the opposite order this app
// stores site coordinates in — so callers convert through this one helper
// rather than flipping tuples inline at each call site.
export function toLngLat([lat, lng]: LatLng): [number, number] {
  return [lng, lat];
}

export interface SitePanorama {
  url: string;
  attribution?: string;
}

interface BaseSite {
  id: string;
  name: string;
  category: string;
  description: string;
  village: string;
  /** 360° equirectangular photo shown in the panorama viewer, if available. */
  panorama?: SitePanorama;
  /** Flat cover photo shown on cards (home, heritage list), if available. */
  cover?: SitePanorama;
}

export interface PointSite extends BaseSite {
  kind: 'point';
  position: LatLng;
}

export interface AreaSite extends BaseSite {
  /** Represents a large-footprint site as a polygon built from multiple boundary points. */
  kind: 'area';
  boundary: LatLng[];
}

export type TourSite = PointSite | AreaSite;

export interface VillageHistoryItem {
  id: string;
  type: 'lich_su' | 'su_kien' | 'phong_tuc' | 'truyen_thuyet';
  title: string;
  period: string | null;
  body: string | null;
}

export interface VillageVideo {
  id: string;
  url: string;
  caption: string | null;
  attribution: string | null;
}

export interface VillageCraftProduct {
  id: string;
  name: string;
  productGroup: string | null;
  startPeriod: string | null;
  isTraditional: boolean | null;
  culturalLinkLevel: string | null;
  materials: string | null;
  productStory: string | null;
  processDescription: string | null;
  giftSuitability: string | null;
  hasExperienceActivity: boolean | null;
  experienceDuration: string | null;
}

export interface VillageArchitectureHighlight {
  id: string;
  name: string;
  function: string | null;
  heritageRank: string | null;
  heritageRankYear: number | null;
  builtPeriod: string | null;
  overallStructureDescription: string | null;
  culturalHistoricalValue: string | null;
  landAreaM2: number | null;
  floorAreaM2: number | null;
  roofMaterial: string | null;
  roofColor: string | null;
  structureMaterial: string | null;
  cover?: SitePanorama;
  /** All flat photos for this building (includes `cover`, if present, as its first entry). */
  photos: Array<SitePanorama & { caption?: string | null }>;
  /** 360° equirectangular photo shown in the panorama viewer, if this building has one. */
  panorama?: SitePanorama;
}

export interface VillageDetails {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  coverUrl: string | null;
  adminLocation: string | null;
  currentAdminLocation: string | null;
  previousAdminLocation: string | null;
  googleMapsLink: string | null;
  foundedPeriod: string | null;
  brandIdentity: string | null;
  nameMeaning: string | null;
  mainOccupations: string[];
  naturalFeatures: string | null;
  siteSelectionHistory: string | null;
  morphologyDescription: string | null;
  morphologyImage?: SitePanorama;
  overview: string | null;
  traditionalCraft: string | null;
  history: VillageHistoryItem[];
  timeline: VillageHistoryItem[];
  customs: VillageHistoryItem[];
  legends: VillageHistoryItem[];
  culturalStories: VillageHistoryItem[];
  craftProducts: VillageCraftProduct[];
  sites: TourSite[];
  gallery: Array<SitePanorama & { alt: string }>;
  videos: VillageVideo[];
  architectureHighlights: VillageArchitectureHighlight[];
  statistics: {
    siteCount: number;
    pointCount: number;
    areaCount: number;
    panoramaCount: number;
    imageCount: number;
  };
}

export function siteCenter(site: TourSite): LatLng {
  if (site.kind === 'point') return site.position;
  return polygonCentroid(site.boundary);
}

// Area-weighted polygon centroid (planar approximation — accurate enough at
// the sub-kilometer footprints this app renders) rather than a naive vertex
// average, so the marker lands at the shape's visual center instead of
// drifting toward whichever side happens to have more boundary points.
function polygonCentroid(points: LatLng[]): LatLng {
  let area = 0;
  let centroidLat = 0;
  let centroidLng = 0;
  for (let i = 0; i < points.length; i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[(i + 1) % points.length];
    const cross = lng1 * lat2 - lng2 * lat1;
    area += cross;
    centroidLng += (lng1 + lng2) * cross;
    centroidLat += (lat1 + lat2) * cross;
  }
  area /= 2;
  if (area === 0) {
    const [latSum, lngSum] = points.reduce(
      ([lat, lng], [pointLat, pointLng]) => [lat + pointLat, lng + pointLng],
      [0, 0],
    );
    return [latSum / points.length, lngSum / points.length];
  }
  return [centroidLat / (6 * area), centroidLng / (6 * area)];
}
