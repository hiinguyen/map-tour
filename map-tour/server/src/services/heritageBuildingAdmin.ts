import type { Pool } from 'pg';

export interface AdminHeritageBuildingPhoto {
  id: string;
  url: string;
  kind: 'anh' | 'panorama';
  caption: string | null;
  attribution: string | null;
}

export interface AdminHeritageBuildingTechnicalDetails {
  roofLayers: string | null;
  roofShape: string | null;
  roofMaterial: string | null;
  roofColor: string | null;
  facadeMaterial: string | null;
  facadeCondition: string | null;
  floorMaterial: string | null;
  floorPattern: string | null;
  structureMaterial: string | null;
  structureCondition: string | null;
  columnHeightCm: number | null;
  columnDiameterCm: number | null;
  pedestalMaterial: string | null;
  pedestalSize: string | null;
  pedestalType: string | null;
}

export interface AdminHeritageBuildingListItem {
  id: string;
  name: string;
  address: string | null;
  function: string | null;
  ownership: string | null;
  landAreaM2: number | null;
  floorAreaM2: number | null;
  heritageRank: string | null;
  heritageRankYear: number | null;
  heritageStyleType: string | null;
  managingUnit: string | null;
  overallStructureDescription: string | null;
  culturalHistoricalValue: string | null;
  builtPeriod: string | null;
  restorationNote: string | null;
  technicalDetails: AdminHeritageBuildingTechnicalDetails;
  photos: AdminHeritageBuildingPhoto[];
}

interface HeritageBuildingAdminRow {
  id: string;
  name: string;
  address: string | null;
  function: string | null;
  ownership: string | null;
  land_area_m2: number | null;
  floor_area_m2: number | null;
  heritage_rank: string | null;
  heritage_rank_year: number | null;
  heritage_style_type: string | null;
  managing_unit: string | null;
  overall_structure_description: string | null;
  cultural_historical_value: string | null;
  built_period: string | null;
  restoration_note: string | null;
  roof_layers: string | null;
  roof_shape: string | null;
  roof_material: string | null;
  roof_color: string | null;
  facade_material: string | null;
  facade_condition: string | null;
  floor_material: string | null;
  floor_pattern: string | null;
  structure_material: string | null;
  structure_condition: string | null;
  column_height_cm: number | null;
  column_diameter_cm: number | null;
  pedestal_material: string | null;
  pedestal_size: string | null;
  pedestal_type: string | null;
}

interface MediaRow {
  id: string;
  url: string;
  kind: 'anh' | 'panorama';
  caption: string | null;
  attribution: string | null;
  owner_entity_id: string;
}

function toTechnicalDetails(row: HeritageBuildingAdminRow): AdminHeritageBuildingTechnicalDetails {
  return {
    roofLayers: row.roof_layers,
    roofShape: row.roof_shape,
    roofMaterial: row.roof_material,
    roofColor: row.roof_color,
    facadeMaterial: row.facade_material,
    facadeCondition: row.facade_condition,
    floorMaterial: row.floor_material,
    floorPattern: row.floor_pattern,
    structureMaterial: row.structure_material,
    structureCondition: row.structure_condition,
    columnHeightCm: row.column_height_cm,
    columnDiameterCm: row.column_diameter_cm,
    pedestalMaterial: row.pedestal_material,
    pedestalSize: row.pedestal_size,
    pedestalType: row.pedestal_type,
  };
}

function toListItem(row: HeritageBuildingAdminRow, photos: AdminHeritageBuildingPhoto[]): AdminHeritageBuildingListItem {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    function: row.function,
    ownership: row.ownership,
    landAreaM2: row.land_area_m2,
    floorAreaM2: row.floor_area_m2,
    heritageRank: row.heritage_rank,
    heritageRankYear: row.heritage_rank_year,
    heritageStyleType: row.heritage_style_type,
    managingUnit: row.managing_unit,
    overallStructureDescription: row.overall_structure_description,
    culturalHistoricalValue: row.cultural_historical_value,
    builtPeriod: row.built_period,
    restorationNote: row.restoration_note,
    technicalDetails: toTechnicalDetails(row),
    photos,
  };
}

export async function listHeritageBuildingsForVillage(
  pool: Pool,
  villageId: string,
): Promise<AdminHeritageBuildingListItem[]> {
  const buildingsResult = await pool.query<HeritageBuildingAdminRow>(
    `SELECT hb.id, hb.name, hb.address, hb."function", hb.ownership, hb.land_area_m2, hb.floor_area_m2,
            hb.heritage_rank, hb.heritage_rank_year, hb.heritage_style_type, hb.managing_unit,
            hb.overall_structure_description, hb.cultural_historical_value, hb.built_period, hb.restoration_note,
            td.roof_layers, td.roof_shape, td.roof_material, td.roof_color,
            td.facade_material, td.facade_condition, td.floor_material, td.floor_pattern,
            td.structure_material, td.structure_condition, td.column_height_cm, td.column_diameter_cm,
            td.pedestal_material, td.pedestal_size, td.pedestal_type
       FROM heritage_buildings hb
       LEFT JOIN heritage_building_technical_details td ON td.building_id = hb.id
      WHERE hb.village_id = $1
      ORDER BY hb.created_at, hb.name`,
    [villageId],
  );

  const buildingIds = buildingsResult.rows.map((row) => row.id);
  const photosByBuildingId = new Map<string, AdminHeritageBuildingPhoto[]>();
  if (buildingIds.length > 0) {
    const photosResult = await pool.query<MediaRow>(
      `SELECT id, url, kind, caption, attribution, owner_entity_id
         FROM media
        WHERE owner_entity_type = 'heritage_buildings' AND owner_entity_id = ANY($1::uuid[])
        ORDER BY created_at`,
      [buildingIds],
    );
    for (const photoRow of photosResult.rows) {
      const photo: AdminHeritageBuildingPhoto = {
        id: photoRow.id,
        url: photoRow.url,
        kind: photoRow.kind,
        caption: photoRow.caption,
        attribution: photoRow.attribution,
      };
      const existing = photosByBuildingId.get(photoRow.owner_entity_id);
      if (existing) {
        existing.push(photo);
      } else {
        photosByBuildingId.set(photoRow.owner_entity_id, [photo]);
      }
    }
  }

  return buildingsResult.rows.map((row) => toListItem(row, photosByBuildingId.get(row.id) ?? []));
}

export interface HeritageBuildingInput {
  name: string;
  address: string | null;
  function: string | null;
  ownership: string | null;
  landAreaM2: number | null;
  floorAreaM2: number | null;
  heritageRank: string | null;
  heritageRankYear: number | null;
  heritageStyleType: string | null;
  managingUnit: string | null;
  overallStructureDescription: string | null;
  culturalHistoricalValue: string | null;
  builtPeriod: string | null;
  restorationNote: string | null;
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

function parseTechnicalDetailsInput(value: unknown): AdminHeritageBuildingTechnicalDetails {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    roofLayers: cleanNullableString(input.roofLayers),
    roofShape: cleanNullableString(input.roofShape),
    roofMaterial: cleanNullableString(input.roofMaterial),
    roofColor: cleanNullableString(input.roofColor),
    facadeMaterial: cleanNullableString(input.facadeMaterial),
    facadeCondition: cleanNullableString(input.facadeCondition),
    floorMaterial: cleanNullableString(input.floorMaterial),
    floorPattern: cleanNullableString(input.floorPattern),
    structureMaterial: cleanNullableString(input.structureMaterial),
    structureCondition: cleanNullableString(input.structureCondition),
    columnHeightCm: cleanNullableNumber(input.columnHeightCm),
    columnDiameterCm: cleanNullableNumber(input.columnDiameterCm),
    pedestalMaterial: cleanNullableString(input.pedestalMaterial),
    pedestalSize: cleanNullableString(input.pedestalSize),
    pedestalType: cleanNullableString(input.pedestalType),
  };
}

export function parseHeritageBuildingInput(
  body: unknown,
): { building: HeritageBuildingInput; technicalDetails: AdminHeritageBuildingTechnicalDetails } {
  const input = (body ?? {}) as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new Error('Tên công trình không được để trống');
  return {
    building: {
      name,
      address: cleanNullableString(input.address),
      function: cleanNullableString(input.function),
      ownership: cleanNullableString(input.ownership),
      landAreaM2: cleanNullableNumber(input.landAreaM2),
      floorAreaM2: cleanNullableNumber(input.floorAreaM2),
      heritageRank: cleanNullableString(input.heritageRank),
      heritageRankYear: cleanNullableNumber(input.heritageRankYear),
      heritageStyleType: cleanNullableString(input.heritageStyleType),
      managingUnit: cleanNullableString(input.managingUnit),
      overallStructureDescription: cleanNullableString(input.overallStructureDescription),
      culturalHistoricalValue: cleanNullableString(input.culturalHistoricalValue),
      builtPeriod: cleanNullableString(input.builtPeriod),
      restorationNote: cleanNullableString(input.restorationNote),
    },
    technicalDetails: parseTechnicalDetailsInput(input.technicalDetails),
  };
}

export async function updateHeritageBuilding(
  pool: Pool,
  buildingId: string,
  building: HeritageBuildingInput,
  technicalDetails: AdminHeritageBuildingTechnicalDetails,
): Promise<{ id: string; name: string } | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query<{ id: string; name: string }>(
      `UPDATE heritage_buildings SET
         name = $2, address = $3, "function" = $4, ownership = $5, land_area_m2 = $6, floor_area_m2 = $7,
         heritage_rank = $8, heritage_rank_year = $9, heritage_style_type = $10, managing_unit = $11,
         overall_structure_description = $12, cultural_historical_value = $13, built_period = $14,
         restoration_note = $15
       WHERE id = $1
       RETURNING id, name`,
      [
        buildingId,
        building.name,
        building.address,
        building.function,
        building.ownership,
        building.landAreaM2,
        building.floorAreaM2,
        building.heritageRank,
        building.heritageRankYear,
        building.heritageStyleType,
        building.managingUnit,
        building.overallStructureDescription,
        building.culturalHistoricalValue,
        building.builtPeriod,
        building.restorationNote,
      ],
    );
    const result = updated.rows[0] ?? null;
    if (!result) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `INSERT INTO heritage_building_technical_details (
         building_id, roof_layers, roof_shape, roof_material, roof_color,
         facade_material, facade_condition, floor_material, floor_pattern,
         structure_material, structure_condition, column_height_cm, column_diameter_cm,
         pedestal_material, pedestal_size, pedestal_type
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (building_id) DO UPDATE SET
         roof_layers = EXCLUDED.roof_layers,
         roof_shape = EXCLUDED.roof_shape,
         roof_material = EXCLUDED.roof_material,
         roof_color = EXCLUDED.roof_color,
         facade_material = EXCLUDED.facade_material,
         facade_condition = EXCLUDED.facade_condition,
         floor_material = EXCLUDED.floor_material,
         floor_pattern = EXCLUDED.floor_pattern,
         structure_material = EXCLUDED.structure_material,
         structure_condition = EXCLUDED.structure_condition,
         column_height_cm = EXCLUDED.column_height_cm,
         column_diameter_cm = EXCLUDED.column_diameter_cm,
         pedestal_material = EXCLUDED.pedestal_material,
         pedestal_size = EXCLUDED.pedestal_size,
         pedestal_type = EXCLUDED.pedestal_type`,
      [
        buildingId,
        technicalDetails.roofLayers,
        technicalDetails.roofShape,
        technicalDetails.roofMaterial,
        technicalDetails.roofColor,
        technicalDetails.facadeMaterial,
        technicalDetails.facadeCondition,
        technicalDetails.floorMaterial,
        technicalDetails.floorPattern,
        technicalDetails.structureMaterial,
        technicalDetails.structureCondition,
        technicalDetails.columnHeightCm,
        technicalDetails.columnDiameterCm,
        technicalDetails.pedestalMaterial,
        technicalDetails.pedestalSize,
        technicalDetails.pedestalType,
      ],
    );

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function addHeritageBuildingPhoto(
  pool: Pool,
  buildingId: string,
  url: string,
  kind: 'anh' | 'panorama',
): Promise<AdminHeritageBuildingPhoto> {
  const result = await pool.query<AdminHeritageBuildingPhoto>(
    `INSERT INTO media (url, kind, owner_entity_type, owner_entity_id)
     VALUES ($1, $2, 'heritage_buildings', $3)
     RETURNING id, url, kind, caption, attribution`,
    [url, kind, buildingId],
  );
  return result.rows[0];
}
