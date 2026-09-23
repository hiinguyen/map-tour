import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { validateRing, villageBoundsFrom } from './boundaryValidate.js';
import { areaSquareMeters, isPointInPolygon } from './geo.js';
import type { LatLng } from './geo.js';
import type { KmlCommitOptions, KmlCommitSummary, ParsedKmlImport } from './kmlTypes.js';

/** Build a ValidateContext for the given village by reading all site positions. */
async function buildValidateContext(
  client: PoolClient,
  villageId: string,
): Promise<{ villageBounds: Awaited<ReturnType<typeof villageBoundsFrom>> }> {
  const res = await client.query<{ position_lat: number; position_lng: number }>(
    `SELECT position_lat, position_lng FROM sites WHERE village_id = $1`,
    [villageId],
  );
  const points: LatLng[] = res.rows.map((r) => [r.position_lat, r.position_lng]);
  // Fall back to a sensible Vietnam-wide box when the village has no sites yet.
  if (points.length === 0) {
    points.push([8.18, 102.14], [23.39, 109.46]);
  }
  return { villageBounds: villageBoundsFrom(points) };
}

/**
 * Re-validate a ring before writing; throws if invalid, causing the caller's
 * catch block to ROLLBACK the whole transaction.
 */
function assertValidRing(ring: LatLng[], ctx: { villageBounds: ReturnType<typeof villageBoundsFrom> }, label: string): void {
  const result = validateRing(ring, ctx);
  if (result.errors.length > 0) {
    throw new Error(`[kmlCommit] ${label}: ${result.errors.join(' | ')}`);
  }
}

/**
 * True when polygon `newRing` should be treated as a duplicate of `existingRing`.
 * Two conditions must BOTH hold:
 *   1. The centroid of newRing lies inside existingRing (same spatial footprint).
 *   2. Their areas are within a 0.5x-2x ratio (same scale, not a small building
 *      inside a large compound).
 */
export function isDuplicateRing(newRing: LatLng[], newAreaM2: number, existingRing: LatLng[]): boolean {
  // Fast path: area ratio filter first (avoids the more expensive pip check).
  const existingAreaM2 = areaSquareMeters(existingRing);
  if (existingAreaM2 <= 0) return false;
  const ratio = newAreaM2 / existingAreaM2;
  if (ratio < 0.5 || ratio > 2) return false;
  // Centroid of newRing = average of its vertices.
  let sumLat = 0, sumLng = 0;
  for (const [lat, lng] of newRing) { sumLat += lat; sumLng += lng; }
  const centroid: LatLng = [sumLat / newRing.length, sumLng / newRing.length];
  return isPointInPolygon(centroid, existingRing);
}

export async function commitKmlImport(
  pool: Pool,
  importData: ParsedKmlImport,
  options?: KmlCommitOptions,
): Promise<KmlCommitSummary> {
  const client: PoolClient = await pool.connect();
  let updatedCount = 0;
  let createdCount = 0;
  let protectedCount = 0;
  let skippedDuplicateCount = 0;
  let skippedUnselectedCount = 0;
  let totalProcessed = 0;

  try {
    await client.query('BEGIN');

    // Build validate context once for all items in this commit.
    const ctx = await buildValidateContext(client, importData.villageId);

    // 1. Matched items
    for (const item of importData.matched) {
      totalProcessed++;
      const siteRes = await client.query('SELECT boundary_source FROM sites WHERE id = $1', [item.siteId]);
      if (siteRes.rows.length === 0) continue;

      const currentSource = siteRes.rows[0].boundary_source;
      if (currentSource === 'admin' && !options?.overwriteAdminEdits) {
        protectedCount++;
        continue;
      }

      // R6: re-validate ring from client payload before writing.
      assertValidRing(item.ring, ctx, `matched site ${item.siteId}`);

      await client.query(
        `UPDATE sites
         SET boundary = $2::jsonb,
             kind = 'area',
             boundary_source = 'kml',
             boundary_updated_at = NOW()
         WHERE id = $1`,
        [item.siteId, JSON.stringify(item.ring)],
      );
      updatedCount++;
    }

    // 2. Ambiguous items (if selectedSiteId is present)
    // R13: parse để selectedSiteId = null cho mọi dòng nhập nhằng; dòng chưa
    // được chọn tay bị bỏ qua và đếm riêng, không bao giờ ghi mặc định.
    for (const item of importData.ambiguous) {
      if (!item.selectedSiteId) {
        skippedUnselectedCount++;
        continue;
      }
      totalProcessed++;

      const siteRes = await client.query('SELECT boundary_source FROM sites WHERE id = $1', [item.selectedSiteId]);
      if (siteRes.rows.length === 0) continue;

      const currentSource = siteRes.rows[0].boundary_source;
      if (currentSource === 'admin' && !options?.overwriteAdminEdits) {
        protectedCount++;
        continue;
      }

      // R6: re-validate before writing.
      assertValidRing(item.ring, ctx, `ambiguous site ${item.selectedSiteId}`);

      await client.query(
        `UPDATE sites
         SET boundary = $2::jsonb,
             kind = 'area',
             boundary_source = 'kml',
             boundary_updated_at = NOW()
         WHERE id = $1`,
        [item.selectedSiteId, JSON.stringify(item.ring)],
      );
      updatedCount++;
    }

    // 3. Unmatched items (if createNewSite is true)
    // R10: Fetch all existing boundaries once, outside the per-item loop.
    // New inserts within this transaction are added to the in-memory list so
    // the next placemark can detect them without an extra round trip.
    const existingRes = await client.query<{ boundary: string; area_m2: number }>(
      `SELECT boundary,
              COALESCE((boundary::jsonb)::text, '') AS boundary
         FROM sites
        WHERE village_id = $1 AND boundary IS NOT NULL`,
      [importData.villageId],
    );
    // Build an in-memory list of (ring, areaM2) for the duplicate check.
    interface BoundaryEntry { ring: LatLng[]; areaM2: number; }
    const existingBoundaries: BoundaryEntry[] = [];
    for (const row of existingRes.rows) {
      let ring: LatLng[] | null = null;
      try { ring = JSON.parse(row.boundary) as LatLng[]; } catch { continue; }
      if (!Array.isArray(ring) || ring.length < 3) continue;
      existingBoundaries.push({ ring, areaM2: areaSquareMeters(ring) });
    }

    for (const item of importData.unmatched) {
      if (!item.createNewSite) continue;
      totalProcessed++;

      // R6: validate ring before INSERT.
      assertValidRing(item.ring, ctx, `new site for placemark "${item.placemarkName}"`);

      const [centLat, centLng] = item.centroid;

      // R7 (fixed): idempotent guard with area-ratio filter.
      // A small building inside a large compound must NOT be suppressed;
      // only a re-import of the same polygon (area within 0.5x-2x) is a duplicate.
      const isDuplicate = existingBoundaries.some(
        (entry) => isDuplicateRing(item.ring, item.areaM2, entry.ring),
      );
      if (isDuplicate) {
        // Separate counter from protectedCount (which is admin-protected rows only).
        skippedDuplicateCount++;
        continue;
      }

      const siteId = randomUUID();
      // R8: 'Di tích kiến trúc' is a valid CATEGORY_STYLES key; 'Khác' is not
      // and falls through to FALLBACK_STYLE which gives a confusing default icon.
      const name = (item.newSiteName || item.placemarkName || 'Địa danh mới').trim();
      const category = (item.newSiteCategory || item.suggestedCategory || 'Di tích kiến trúc').trim();
      const lat = centLat;
      const lng = centLng;

      await client.query(
        `INSERT INTO sites
          (id, village_id, name, category, position_lat, position_lng, kind, boundary, boundary_source, boundary_updated_at)
         VALUES
          ($1, $2, $3, $4, $5, $6, 'area', $7::jsonb, 'kml', NOW())`,
        [siteId, importData.villageId, name, category, centLat, centLng, JSON.stringify(item.ring)],
      );
      // Add the new boundary to the in-memory list so subsequent placemarks
      // in this same commit can detect it as a duplicate without a DB round trip.
      existingBoundaries.push({ ring: item.ring, areaM2: item.areaM2 });
      createdCount++;
    }

    await client.query('COMMIT');

    return {
      updatedCount,
      createdCount,
      protectedCount,
      skippedDuplicateCount,
      skippedUnselectedCount,
      totalProcessed,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
