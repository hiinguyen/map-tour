import type { Pool } from 'pg';

export interface VillageBasicInfoInput {
  name: string;
  aliases: string[];
  adminLocation: string | null;
  googleMapsLink: string | null;
  foundedPeriod: string | null;
  brandIdentity: string | null;
  nameMeaning: string | null;
  mainOccupations: string[];
  naturalFeatures: string | null;
  siteSelectionHistory: string | null;
  morphologyDescription: string | null;
}

interface VillageBasicInfoResult {
  id: string;
  slug: string;
  name: string;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function cleanNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseVillageBasicInfoInput(body: unknown): VillageBasicInfoInput {
  const input = (body ?? {}) as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new Error('Tên làng không được để trống');
  return {
    name,
    aliases: cleanStringArray(input.aliases),
    adminLocation: cleanNullableString(input.adminLocation),
    googleMapsLink: cleanNullableString(input.googleMapsLink),
    foundedPeriod: cleanNullableString(input.foundedPeriod),
    brandIdentity: cleanNullableString(input.brandIdentity),
    nameMeaning: cleanNullableString(input.nameMeaning),
    mainOccupations: cleanStringArray(input.mainOccupations),
    naturalFeatures: cleanNullableString(input.naturalFeatures),
    siteSelectionHistory: cleanNullableString(input.siteSelectionHistory),
    morphologyDescription: cleanNullableString(input.morphologyDescription),
  };
}

// Slug is deliberately untouched here — it's baked into public URLs
// (/lang/:villageSlug); recomputing it from an edited name would break
// existing links and bookmarks. Renaming a village's slug is out of scope
// for this basic-info editor.
export async function updateVillageBasicInfo(
  pool: Pool,
  villageId: string,
  input: VillageBasicInfoInput,
): Promise<VillageBasicInfoResult | null> {
  const result = await pool.query<VillageBasicInfoResult>(
    `UPDATE villages SET
       name = $2, aliases = $3, admin_location = $4, google_maps_link = $5, founded_period = $6,
       brand_identity = $7, name_meaning = $8, main_occupations = $9, natural_features = $10,
       site_selection_history = $11, morphology_description = $12
     WHERE id = $1
     RETURNING id, slug, name`,
    [
      villageId,
      input.name,
      input.aliases,
      input.adminLocation,
      input.googleMapsLink,
      input.foundedPeriod,
      input.brandIdentity,
      input.nameMeaning,
      input.mainOccupations,
      input.naturalFeatures,
      input.siteSelectionHistory,
      input.morphologyDescription,
    ],
  );
  return result.rows[0] ?? null;
}

export async function setVillageCoverImage(pool: Pool, villageId: string, url: string): Promise<{ coverUrl: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM media WHERE owner_entity_type = 'villages' AND owner_entity_id = $1 AND kind = 'anh' LIMIT 1`,
      [villageId],
    );
    let mediaId: string;
    if (existing.rows.length > 0) {
      mediaId = existing.rows[0].id;
      await client.query('UPDATE media SET url = $2 WHERE id = $1', [mediaId, url]);
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO media (url, kind, owner_entity_type, owner_entity_id) VALUES ($1, 'anh', 'villages', $2) RETURNING id`,
        [url, villageId],
      );
      mediaId = inserted.rows[0].id;
    }
    await client.query('UPDATE villages SET cover_media_id = $2 WHERE id = $1', [villageId, mediaId]);
    await client.query('COMMIT');
    return { coverUrl: url };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function removeVillageCoverImage(pool: Pool, villageId: string): Promise<void> {
  await pool.query('UPDATE villages SET cover_media_id = NULL WHERE id = $1', [villageId]);
}
