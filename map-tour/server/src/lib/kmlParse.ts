import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { distanceMeters, isPointInPolygon, type Bounds, type LatLng } from './geo.js';
import { openRing, validateRing, villageBoundsFrom } from './boundaryValidate.js';

import type {
  AmbiguousCandidate,
  AmbiguousKmlItem,
  MatchedKmlItem,
  ParsedKmlImport,
  RejectedKmlItem,
  UnmatchedKmlItem,
  UnsupportedKmlItem,
} from './kmlTypes.js';

export interface SiteRecord {
  id: string;
  name: string;
  category: string;
  position_lat: number;
  position_lng: number;
  land_area_m2?: number | null;
  boundary_source?: string | null;
}

export function mapFolderToCategory(folderName: string): string | null {
  if (!folderName) return null;
  const normalized = folderName.trim().normalize('NFC').toLowerCase();
  if (normalized.includes('tâm linh')) return 'Di tích tín ngưỡng';
  if (normalized.includes('nhà cổ')) return 'Nhà cổ';
  if (normalized.includes('mặt nước')) return 'Mặt nước';
  if (normalized.includes('công cộng') || normalized.includes('văn hóa') || normalized.includes('văn hoá')) {
    return 'Công trình công cộng';
  }
  if (normalized.includes('giá trị') || normalized.includes('cảnh quan')) return 'Cảnh quan';
  if (normalized.includes('cây cổ thụ') || normalized.includes('cây')) return 'Cây';
  if (normalized.includes('truyền thống') || normalized.includes('làng nghề')) return 'Làng nghề';
  return null;
}

export function normalizeKmlName(name: string): string {
  if (!name) return '';
  return name
    .normalize('NFC')
    .toLowerCase()
    .replace(/^(ranh\s*giới|ranh|rảnh)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTextValue(node: unknown): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj['#text'] !== undefined) return String(obj['#text']).trim();
  }
  return '';
}

function parseCoordinatesText(raw: string): LatLng[] {
  const tokens = raw.trim().split(/\s+/);
  const ring: LatLng[] = [];
  for (const token of tokens) {
    if (!token) continue;
    const parts = token.split(',');
    if (parts.length < 2) continue;
    const lng = Number.parseFloat(parts[0]);
    const lat = Number.parseFloat(parts[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const roundedLat = Number(lat.toFixed(7));
      const roundedLng = Number(lng.toFixed(7));
      ring.push([roundedLat, roundedLng]);
    }
  }
  return openRing(ring);
}

interface RawPlacemark {
  name: string;
  folderName: string;
  isPolygon: boolean;
  isLineString: boolean;
  isPoint: boolean;
  isUnsupportedMulti: boolean;
  coordinatesRaw?: string;
}

function walkKmlNodes(node: unknown, currentFolder: string, out: RawPlacemark[]): void {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (const item of node) {
      walkKmlNodes(item, currentFolder, out);
    }
    return;
  }

  const obj = node as Record<string, unknown>;

  // Check folder name if node is a Folder
  let folderName = currentFolder;
  if (obj.name && (obj.Folder !== undefined || obj.Placemark !== undefined)) {
    const fName = getTextValue(obj.name);
    if (fName && fName.toLowerCase() !== 'kml') {
      folderName = fName;
    }
  }

  // Recurse into Document or Folder
  if (obj.kml) walkKmlNodes(obj.kml, folderName, out);
  if (obj.Document) walkKmlNodes(obj.Document, folderName, out);
  if (obj.Folder) walkKmlNodes(obj.Folder, folderName, out);

  // If node is Placemark
  if (obj.Placemark) {
    const placemarks = Array.isArray(obj.Placemark) ? obj.Placemark : [obj.Placemark];
    for (const pm of placemarks) {
      if (!pm || typeof pm !== 'object') continue;
      const pmObj = pm as Record<string, unknown>;
      const pName = getTextValue(pmObj.name) || 'Chưa đặt tên';

      const polygon = pmObj.Polygon as Record<string, unknown> | undefined;
      const multiGeo = pmObj.MultiGeometry as Record<string, unknown> | undefined;
      const lineString = pmObj.LineString;
      const point = pmObj.Point;

      if (multiGeo) {
        // MultiGeometry check
        out.push({
          name: pName,
          folderName,
          isPolygon: true,
          isLineString: false,
          isPoint: false,
          isUnsupportedMulti: true,
        });
        continue;
      }

      if (polygon) {
        if (polygon.innerBoundaryIs) {
          out.push({
            name: pName,
            folderName,
            isPolygon: true,
            isLineString: false,
            isPoint: false,
            isUnsupportedMulti: true,
          });
          continue;
        }

        let coordsText = '';
        const outer = polygon.outerBoundaryIs as Record<string, unknown> | undefined;
        if (outer) {
          const ringNode = outer.LinearRing as Record<string, unknown> | undefined;
          if (ringNode) {
            coordsText = getTextValue(ringNode.coordinates);
          }
        }

        out.push({
          name: pName,
          folderName,
          isPolygon: true,
          isLineString: false,
          isPoint: false,
          isUnsupportedMulti: false,
          coordinatesRaw: coordsText,
        });
      } else if (lineString) {
        out.push({
          name: pName,
          folderName,
          isPolygon: false,
          isLineString: true,
          isPoint: false,
          isUnsupportedMulti: false,
        });
      } else if (point) {
        out.push({
          name: pName,
          folderName,
          isPolygon: false,
          isLineString: false,
          isPoint: true,
          isUnsupportedMulti: false,
        });
      }
    }
  }
}

export async function extractKmlText(buffer: Buffer): Promise<string> {
  // Check ZIP magic header PK\x03\x04
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    const zip = await JSZip.loadAsync(buffer);
    const kmlFiles = zip.file(/\.kml$/i);
    if (kmlFiles.length === 0) {
      throw new Error('Không tìm thấy file .kml trong file KMZ.');
    }
    if (kmlFiles.length > 1) {
      throw new Error('File KMZ chứa nhiều hơn 1 file .kml.');
    }
    return kmlFiles[0].async('string');
  }
  return buffer.toString('utf-8');
}

export function parseKmlDocument(
  kmlText: string,
  villageId: string,
  villageName: string,
  fileName: string,
  villageSites: SiteRecord[],
): ParsedKmlImport {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
  });

  const parsedXml = parser.parse(kmlText);

  const rawPlacemarks: RawPlacemark[] = [];
  walkKmlNodes(parsedXml, '', rawPlacemarks);

  // Compute village bounds from existing site positions
  const sitePositions: LatLng[] = villageSites.map((s) => [s.position_lat, s.position_lng]);
  const defaultBounds: Bounds =
    sitePositions.length > 0
      ? villageBoundsFrom(sitePositions)
      : { south: 20.7, north: 20.9, west: 105.7, east: 105.9 };

  const matched: MatchedKmlItem[] = [];
  const ambiguous: AmbiguousKmlItem[] = [];
  const unmatched: UnmatchedKmlItem[] = [];
  const unsupported: UnsupportedKmlItem[] = [];
  const rejected: RejectedKmlItem[] = [];

  let lineStringCount = 0;
  let pointCount = 0;
  let totalPolygons = 0;

  const matchedSiteIds = new Set<string>();

  for (const pm of rawPlacemarks) {
    if (pm.isLineString) {
      lineStringCount++;
      continue;
    }
    if (pm.isPoint) {
      pointCount++;
      continue;
    }

    if (!pm.isPolygon) continue;

    totalPolygons++;

    if (pm.isUnsupportedMulti) {
      unsupported.push({
        placemarkName: pm.name,
        folderName: pm.folderName,
        reason: 'MultiGeometry hoặc polygon có lỗ (innerBoundaryIs) không được hỗ trợ.',
      });
      continue;
    }

    if (!pm.coordinatesRaw) {
      rejected.push({
        placemarkName: pm.name,
        folderName: pm.folderName,
        errors: ['Không tìm thấy tọa độ coordinates trong đĩa đa giác.'],
      });
      continue;
    }

    const ring = parseCoordinatesText(pm.coordinatesRaw);
    const valResult = validateRing(ring, { villageBounds: defaultBounds });

    if (valResult.errors.length > 0) {
      rejected.push({
        placemarkName: pm.name,
        folderName: pm.folderName,
        errors: valResult.errors,
      });
      continue;
    }

    const validRing = valResult.ring;
    const areaM2 = valResult.areaM2;
    const centroid = valResult.centroid!;
    const warnings = valResult.warnings;

    // Score against all sites in village
    const pNameNorm = normalizeKmlName(pm.name);
    const folderCat = mapFolderToCategory(pm.folderName);

    const scoredCandidates: Array<{ site: SiteRecord; score: number }> = [];

    for (const site of villageSites) {
      const sitePos: LatLng = [site.position_lat, site.position_lng];
      let score = 0;

      // 1. Point in polygon (100 pts)
      if (isPointInPolygon(sitePos, validRing)) {
        score += 100;
      }

      // 2. Distance centroid to site <= 30m (60 - dist * 2 pts)
      const dist = distanceMeters(sitePos, centroid);
      if (dist <= 30) {
        score += Math.max(0, 60 - dist * 2);
      }

      // 3. Name match (exact = 80, substring = 40)
      const sNameNorm = normalizeKmlName(site.name);
      if (pNameNorm && sNameNorm) {
        if (pNameNorm === sNameNorm) {
          score += 80;
        } else if (pNameNorm.includes(sNameNorm) || sNameNorm.includes(pNameNorm)) {
          score += 40;
        }
      }

      // 4. Category match (20 pts)
      if (folderCat && site.category === folderCat) {
        score += 20;
      }

      if (score > 0) {
        scoredCandidates.push({ site, score });
      }
    }

    scoredCandidates.sort((a, b) => b.score - a.score);

    const topMatch = scoredCandidates[0];

    if (topMatch && topMatch.score >= 100) {
      matchedSiteIds.add(topMatch.site.id);
      matched.push({
        siteId: topMatch.site.id,
        siteName: topMatch.site.name,
        placemarkName: pm.name,
        confidence: 'confident',
        score: topMatch.score,
        ring: validRing,
        areaM2,
        centroid,
        landAreaM2: topMatch.site.land_area_m2,
        warnings,
        protected: topMatch.site.boundary_source === 'admin',
      });
    } else if (topMatch && topMatch.score >= 40) {
      const candidateList: AmbiguousCandidate[] = scoredCandidates
        .filter((c) => c.score >= 40)
        .map((c) => ({
          siteId: c.site.id,
          siteName: c.site.name,
          score: c.score,
        }));

      ambiguous.push({
        placemarkName: pm.name,
        confidence: 'weak',
        score: topMatch.score,
        candidates: candidateList,
        // R13: một dòng nhập nhằng KHÔNG bao giờ được ghi mặc định. Người dùng
        // phải chọn tay từng dòng trong bước xem trước; kmlCommit bỏ qua khi
        // selectedSiteId rỗng.
        selectedSiteId: null,
        ring: validRing,
        areaM2,
        centroid,
        landAreaM2: topMatch.site.land_area_m2,
        warnings,
        protected: topMatch.site.boundary_source === 'admin',
      });
    } else {
      unmatched.push({
        placemarkName: pm.name,
        folderName: pm.folderName,
        suggestedCategory: folderCat || '',
        ring: validRing,
        areaM2,
        centroid,
        warnings,
      });
    }
  }

  const sitesWithoutBoundary = villageSites
    .filter((s) => !matchedSiteIds.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, category: s.category }));

  return {
    villageId,
    villageName,
    fileName,
    matched,
    ambiguous,
    unmatched,
    unsupported,
    rejected,
    sitesWithoutBoundary,
    counts: {
      totalPolygons,
      matchedCount: matched.length,
      ambiguousCount: ambiguous.length,
      unmatchedCount: unmatched.length,
      unsupportedCount: unsupported.length,
      rejectedCount: rejected.length,
      lineStringCount,
      pointCount,
    },
  };
}
