import type { Pool } from 'pg';
import { formatBoundaryInput, parseBoundaryInput } from '../lib/boundaryInput.js';
import { validateRing, villageBoundsFrom } from '../lib/boundaryValidate.js';
import type { LatLng } from '../lib/geo.js';

export interface AdminSiteListItem {
  id: string;
  kind: 'point' | 'area';
  name: string;
  category: string;
  subCategory: string | null;
  shortDescription: string | null;
  lightCount25m: number | null;
  historyCultureNote: string | null;
  positionLat: number | null;
  positionLng: number | null;
  boundaryPointCount: number;
  rawBoundary: string | null;
  coverUrl: string | null;
  panoramaUrl: string | null;
}

interface SiteAdminRow {
  id: string;
  kind: 'point' | 'area';
  name: string;
  category: string;
  sub_category: string | null;
  short_description: string | null;
  light_count_25m: number | null;
  history_culture_note: string | null;
  position_lat: number | null;
  position_lng: number | null;
  boundary: LatLng[] | null;
  cover_url: string | null;
  panorama_url: string | null;
}

function toAdminSite(row: SiteAdminRow): AdminSiteListItem {
  const boundaryArr = Array.isArray(row.boundary) ? row.boundary : null;
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category,
    shortDescription: row.short_description,
    lightCount25m: row.light_count_25m,
    historyCultureNote: row.history_culture_note,
    positionLat: row.position_lat,
    positionLng: row.position_lng,
    boundaryPointCount: boundaryArr?.length ?? 0,
    rawBoundary: boundaryArr && boundaryArr.length > 0 ? formatBoundaryInput(boundaryArr) : null,
    coverUrl: row.cover_url,
    panoramaUrl: row.panorama_url,
  };
}

export async function listSitesForVillage(pool: Pool, villageId: string): Promise<AdminSiteListItem[]> {
  const result = await pool.query<SiteAdminRow>(
    `SELECT s.id, s.kind, s.name, s.category, s.sub_category, s.short_description,
            s.light_count_25m, s.history_culture_note, s.position_lat, s.position_lng, s.boundary,
            cover.url AS cover_url, panorama.url AS panorama_url
       FROM sites s
       LEFT JOIN media cover ON cover.id = s.cover_media_id
       LEFT JOIN media panorama ON panorama.id = s.panorama_media_id
      WHERE s.village_id = $1
      ORDER BY s.created_at, s.name`,
    [villageId],
  );
  return result.rows.map(toAdminSite);
}

export interface SiteBasicInfoInput {
  name: string;
  category: string;
  subCategory: string | null;
  shortDescription: string | null;
  lightCount25m: number | null;
  historyCultureNote: string | null;
  positionLat: number | null;
  positionLng: number | null;
  boundaryInput?: string | null;
}

function cleanNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function parseSiteBasicInfoInput(body: unknown): SiteBasicInfoInput {
  const input = (body ?? {}) as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new Error('Tên điểm tham quan không được để trống');
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  if (!category) throw new Error('Loại điểm không được để trống');
  const boundaryInput = typeof input.boundaryInput === 'string' ? input.boundaryInput : (input.boundaryInput === null ? null : undefined);
  return {
    name,
    category,
    subCategory: cleanNullableString(input.subCategory),
    shortDescription: cleanNullableString(input.shortDescription),
    lightCount25m: cleanNullableNumber(input.lightCount25m),
    historyCultureNote: cleanNullableString(input.historyCultureNote),
    positionLat: cleanNullableNumber(input.positionLat),
    positionLng: cleanNullableNumber(input.positionLng),
    boundaryInput,
  };
}

export async function updateSiteBasicInfo(
  pool: Pool,
  siteId: string,
  input: SiteBasicInfoInput,
): Promise<{
  id: string;
  name: string;
  kind?: 'point' | 'area';
  detectedFormat?: string;
  vertexCount?: number;
  areaM2?: number;
  warnings?: string[];
} | null> {
  const existingResult = await pool.query<{ village_id: string; heritage_building_id: string | null }>(
    'SELECT village_id, heritage_building_id FROM sites WHERE id = $1',
    [siteId],
  );
  const site = existingResult.rows[0];
  if (!site) return null;

  let posLat = input.positionLat;
  let posLng = input.positionLng;

  if (input.boundaryInput !== undefined) {
    if (input.boundaryInput !== null && input.boundaryInput.trim().length > 0) {
      const parsed = parseBoundaryInput(input.boundaryInput);
      if (parsed.errors.length > 0) {
        throw new Error(parsed.errors.join('; '));
      }

      let landAreaM2: number | null = null;
      if (site.heritage_building_id) {
        const hbResult = await pool.query<{ land_area_m2: number | null }>(
          'SELECT land_area_m2 FROM heritage_buildings WHERE id = $1',
          [site.heritage_building_id],
        );
        landAreaM2 = hbResult.rows[0]?.land_area_m2 ?? null;
      }

      const sitesInVillage = await pool.query<{ position_lat: number; position_lng: number; boundary: unknown }>(
        'SELECT position_lat, position_lng, boundary FROM sites WHERE village_id = $1',
        [site.village_id],
      );
      const allPoints: LatLng[] = [];
      for (const r of sitesInVillage.rows) {
        if (r.position_lat !== null && r.position_lng !== null) {
          allPoints.push([r.position_lat, r.position_lng]);
        }
        if (Array.isArray(r.boundary)) {
          for (const pt of r.boundary) {
            if (Array.isArray(pt) && pt.length >= 2) allPoints.push([pt[0], pt[1]]);
          }
        }
      }
      const villageBounds = villageBoundsFrom(allPoints.length > 0 ? allPoints : [[20.8, 105.8]]);
      const validated = validateRing(parsed.ring, { villageBounds, landAreaM2 });

      if (validated.errors.length > 0) {
        throw new Error(validated.errors.join('; '));
      }

      if ((posLat === null || posLng === null) && validated.centroid) {
        posLat = validated.centroid[0];
        posLng = validated.centroid[1];
      }

      if (posLat === null || posLng === null) {
        throw new Error('Toạ độ điểm không được để trống');
      }

      const result = await pool.query<{ id: string; name: string }>(
        `UPDATE sites SET
           name = $2, category = $3, sub_category = $4, short_description = $5,
           light_count_25m = $6, history_culture_note = $7, position_lat = $8, position_lng = $9,
           boundary = $10::jsonb, kind = 'area', boundary_source = 'admin', boundary_updated_at = NOW()
         WHERE id = $1
         RETURNING id, name`,
        [
          siteId,
          input.name,
          input.category,
          input.subCategory,
          input.shortDescription,
          input.lightCount25m,
          input.historyCultureNote,
          posLat,
          posLng,
          JSON.stringify(validated.ring),
        ],
      );
      const updated = result.rows[0];
      if (!updated) return null;
      return {
        id: updated.id,
        name: updated.name,
        kind: 'area',
        detectedFormat: parsed.format,
        vertexCount: validated.ring.length,
        areaM2: validated.areaM2,
        warnings: validated.warnings,
      };
    } else {
      // Clear boundary
      if (posLat === null || posLng === null) {
        throw new Error('Toạ độ điểm không được để trống');
      }
      const result = await pool.query<{ id: string; name: string }>(
        `UPDATE sites SET
           name = $2, category = $3, sub_category = $4, short_description = $5,
           light_count_25m = $6, history_culture_note = $7, position_lat = $8, position_lng = $9,
           boundary = NULL, kind = 'point', boundary_source = NULL, boundary_updated_at = NULL
         WHERE id = $1
         RETURNING id, name`,
        [
          siteId,
          input.name,
          input.category,
          input.subCategory,
          input.shortDescription,
          input.lightCount25m,
          input.historyCultureNote,
          posLat,
          posLng,
        ],
      );
      const updated = result.rows[0];
      if (!updated) return null;
      return { id: updated.id, name: updated.name, kind: 'point' };
    }
  }

  if (posLat === null || posLng === null) {
    throw new Error('Toạ độ điểm không được để trống');
  }

  const result = await pool.query<{ id: string; name: string }>(
    `UPDATE sites SET
       name = $2, category = $3, sub_category = $4, short_description = $5,
       light_count_25m = $6, history_culture_note = $7, position_lat = $8, position_lng = $9
     WHERE id = $1
     RETURNING id, name`,
    [
      siteId,
      input.name,
      input.category,
      input.subCategory,
      input.shortDescription,
      input.lightCount25m,
      input.historyCultureNote,
      posLat,
      posLng,
    ],
  );
  return result.rows[0] ?? null;
}

type SiteImageKind = 'anh' | 'panorama';

const SITE_IMAGE_COLUMN: Record<SiteImageKind, 'cover_media_id' | 'panorama_media_id'> = {
  anh: 'cover_media_id',
  panorama: 'panorama_media_id',
};

export async function setSiteImage(
  pool: Pool,
  siteId: string,
  url: string,
  kind: SiteImageKind,
): Promise<{ url: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const column = SITE_IMAGE_COLUMN[kind];
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM media WHERE owner_entity_type = 'sites' AND owner_entity_id = $1 AND kind = $2 LIMIT 1`,
      [siteId, kind],
    );
    let mediaId: string;
    if (existing.rows.length > 0) {
      mediaId = existing.rows[0].id;
      await client.query('UPDATE media SET url = $2 WHERE id = $1', [mediaId, url]);
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO media (url, kind, owner_entity_type, owner_entity_id) VALUES ($1, $2, 'sites', $3) RETURNING id`,
        [url, kind, siteId],
      );
      mediaId = inserted.rows[0].id;
    }
    await client.query(`UPDATE sites SET ${column} = $2 WHERE id = $1`, [siteId, mediaId]);
    await client.query('COMMIT');
    return { url };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function removeSiteImage(pool: Pool, siteId: string, kind: SiteImageKind): Promise<void> {
  const column = SITE_IMAGE_COLUMN[kind];
  await pool.query(`UPDATE sites SET ${column} = NULL WHERE id = $1`, [siteId]);
}
