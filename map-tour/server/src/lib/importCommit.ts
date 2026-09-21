import type { Pool, PoolClient } from 'pg';
import type { ImportCommitSummary, ParsedImport } from './importTypes.js';
import { slugifyVietnamese } from './slugify.js';

// Every upsert here matches by natural name (village/building/product name),
// the same idempotency convention the hand-written migrations use (see
// migrations/003_update_coordinates.sql) — id columns are gen_random_uuid()
// with no natural key, so re-running an import for the same village updates
// existing rows instead of duplicating them.

async function upsertVillage(
  client: PoolClient,
  village: NonNullable<ParsedImport['village']>,
): Promise<{ id: string; action: 'created' | 'updated' }> {
  // migrations/022_fix_spelling_and_capitalization.sql prefixed every village
  // name with "Làng " after this importer was written, so workbook-derived
  // short names ("Cự Đà") no longer match villages.name exactly — try both
  // forms, case-insensitively.
  const existing = await client.query<{ id: string; slug: string }>(
    'SELECT id, slug FROM villages WHERE lower(name) = lower($1) OR lower(name) = lower($2)',
    [village.name, `Làng ${village.name}`],
  );
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    // Preserve the existing slug: it's a stable public identifier (URLs,
    // other migrations' `WHERE slug = '...'` lookups) and must not silently
    // change just because this village's name doesn't slugify the same way
    // its slug was originally set (e.g. villages.slug='lang-uoc-le' but
    // slugifyVietnamese('Ước Lễ') would give 'uoc-le' — see migrations/005).
    await client.query(
      `UPDATE villages SET
        aliases = $2, admin_location = $3, google_maps_link = $4, founded_period = $5,
        brand_identity = $6, name_meaning = $7, main_occupations = $8, natural_features = $9,
        site_selection_history = $10, morphology_description = $11
       WHERE id = $1`,
      [
        id,
        village.aliases,
        village.adminLocation,
        village.googleMapsLink,
        village.foundedPeriod,
        village.brandIdentity,
        village.nameMeaning,
        village.mainOccupations,
        village.naturalFeatures,
        village.siteSelectionHistory,
        village.morphologyDescription,
      ],
    );
    return { id, action: 'updated' };
  }

  // New village (no existing row under either name form): store it with the
  // "Làng " prefix so it matches the naming convention migrations/022
  // established for every other village.
  const name = /^làng\s/i.test(village.name) ? village.name : `Làng ${village.name}`;
  const slug = slugifyVietnamese(name);
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO villages (
       name, slug, aliases, admin_location, google_maps_link, founded_period,
       brand_identity, name_meaning, main_occupations, natural_features,
       site_selection_history, morphology_description
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      name,
      slug,
      village.aliases,
      village.adminLocation,
      village.googleMapsLink,
      village.foundedPeriod,
      village.brandIdentity,
      village.nameMeaning,
      village.mainOccupations,
      village.naturalFeatures,
      village.siteSelectionHistory,
      village.morphologyDescription,
    ],
  );
  return { id: inserted.rows[0].id, action: 'created' };
}

async function upsertHeritageBuilding(
  client: PoolClient,
  building: ParsedImport['heritageBuildings'][number],
  villageId: string | null,
): Promise<string> {
  // Case-insensitive, like resolveBuildingId() in scripts/lib/villagePhotoImport.ts —
  // some source workbooks capitalize a building's name differently than an
  // earlier hand-written migration did (e.g. "nhà cụ Khả (3)" vs "Nhà cụ Khả
  // (3)"), and an exact match would silently create a duplicate building
  // instead of updating the existing one.
  const existing = await client.query<{ id: string }>('SELECT id FROM heritage_buildings WHERE lower(name) = lower($1)', [
    building.name,
  ]);
  const values = [
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
    villageId,
  ];

  let buildingId: string;
  if (existing.rows.length > 0) {
    buildingId = existing.rows[0].id;
    await client.query(
      `UPDATE heritage_buildings SET
        address=$2, "function"=$3, ownership=$4, land_area_m2=$5, floor_area_m2=$6,
        heritage_rank=$7, heritage_rank_year=$8, heritage_style_type=$9, managing_unit=$10,
        overall_structure_description=$11, cultural_historical_value=$12, built_period=$13,
        village_id=COALESCE($14, village_id)
       WHERE id = $1`,
      [buildingId, ...values],
    );
  } else {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO heritage_buildings (
         name, address, "function", ownership, land_area_m2, floor_area_m2,
         heritage_rank, heritage_rank_year, heritage_style_type, managing_unit,
         overall_structure_description, cultural_historical_value, built_period, village_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [building.name, ...values],
    );
    buildingId = inserted.rows[0].id;
  }

  const details = building.technicalDetails;
  const hasDetails = Object.values(details).some((value) => value !== null);
  if (hasDetails) {
    const existingDetails = await client.query<{ id: string }>(
      'SELECT id FROM heritage_building_technical_details WHERE building_id = $1',
      [buildingId],
    );
    const detailValues = [
      details.roofLayers,
      details.roofShape,
      details.roofMaterial,
      details.roofColor,
      details.facadeMaterial,
      details.facadeCondition,
      details.floorMaterial,
      details.floorPattern,
      details.structureMaterial,
      details.structureCondition,
      details.pedestalMaterial,
      details.pedestalSize,
      details.pedestalType,
    ];
    if (existingDetails.rows.length > 0) {
      await client.query(
        `UPDATE heritage_building_technical_details SET
          roof_layers=$2, roof_shape=$3, roof_material=$4, roof_color=$5,
          facade_material=$6, facade_condition=$7, floor_material=$8, floor_pattern=$9,
          structure_material=$10, structure_condition=$11, pedestal_material=$12,
          pedestal_size=$13, pedestal_type=$14
         WHERE building_id = $1`,
        [buildingId, ...detailValues],
      );
    } else {
      await client.query(
        `INSERT INTO heritage_building_technical_details (
           building_id, roof_layers, roof_shape, roof_material, roof_color,
           facade_material, facade_condition, floor_material, floor_pattern,
           structure_material, structure_condition, pedestal_material, pedestal_size, pedestal_type
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [buildingId, ...detailValues],
      );
    }
  }

  return buildingId;
}

async function upsertHistoryStory(
  client: PoolClient,
  villageId: string,
  story: ParsedImport['historyStories'][number],
): Promise<void> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM history_stories WHERE village_id = $1 AND title = $2',
    [villageId, story.title],
  );
  if (existing.rows.length > 0) {
    await client.query('UPDATE history_stories SET type = $2, body_text = $3 WHERE id = $1', [
      existing.rows[0].id,
      story.type,
      story.bodyText,
    ]);
  } else {
    await client.query(
      'INSERT INTO history_stories (village_id, type, title, body_text) VALUES ($1,$2,$3,$4)',
      [villageId, story.type, story.title, story.bodyText],
    );
  }
}

async function upsertDecorativeArtItem(
  client: PoolClient,
  buildingId: string,
  item: ParsedImport['decorativeArtItems'][number],
): Promise<void> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM decorative_art_items WHERE building_id = $1 AND subject_name = $2',
    [buildingId, item.subjectName],
  );
  if (existing.rows.length > 0) {
    await client.query(
      'UPDATE decorative_art_items SET theme_group = $2, era_estimate = $3, description = $4 WHERE id = $1',
      [existing.rows[0].id, item.themeGroup, item.eraEstimate, item.description],
    );
  } else {
    await client.query(
      `INSERT INTO decorative_art_items (building_id, theme_group, subject_name, era_estimate, description)
       VALUES ($1,$2,$3,$4,$5)`,
      [buildingId, item.themeGroup, item.subjectName, item.eraEstimate, item.description],
    );
  }
}

async function upsertIntangibleHeritageItem(
  client: PoolClient,
  villageId: string,
  item: ParsedImport['intangibleHeritageItems'][number],
): Promise<void> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM intangible_heritage_items WHERE village_id = $1 AND name = $2',
    [villageId, item.name],
  );
  const values = [
    item.recognitionLevel,
    item.uniquenessDescription,
    item.participationScope,
    item.generationsTransmitted,
    item.touristExperienceLevel,
    item.eventTiming,
    item.capacityNote,
  ];
  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE intangible_heritage_items SET
        recognition_level=$2, uniqueness_description=$3, participation_scope=$4,
        generations_transmitted=$5, tourist_experience_level=$6, event_timing=$7, capacity_note=$8
       WHERE id = $1`,
      [existing.rows[0].id, ...values],
    );
  } else {
    await client.query(
      `INSERT INTO intangible_heritage_items (
         village_id, name, recognition_level, uniqueness_description, participation_scope,
         generations_transmitted, tourist_experience_level, event_timing, capacity_note
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [villageId, item.name, ...values],
    );
  }
}

async function upsertCraftProduct(
  client: PoolClient,
  villageId: string,
  product: ParsedImport['craftProducts'][number],
): Promise<void> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM craft_products WHERE village_id = $1 AND name = $2',
    [villageId, product.name],
  );
  const values = [
    product.productGroup,
    product.startPeriod,
    product.isTraditional,
    product.culturalLinkLevel,
    product.materials,
    product.productStory,
    product.processDescription,
    product.giftSuitability,
    product.hasExperienceActivity,
    product.experienceDuration,
    product.hasDemoSpace,
    product.hasDisplayArea,
    product.hasGuideStaff,
    product.salesChannels,
    product.mainMarket,
  ];

  let productId: string;
  if (existing.rows.length > 0) {
    productId = existing.rows[0].id;
    await client.query(
      `UPDATE craft_products SET
        product_group=$2, start_period=$3, is_traditional=$4, cultural_link_level=$5,
        materials=$6, product_story=$7, process_description=$8, gift_suitability=$9,
        has_experience_activity=$10, experience_duration=$11, has_demo_space=$12,
        has_display_area=$13, has_guide_staff=$14, sales_channels=$15, main_market=$16
       WHERE id = $1`,
      [productId, ...values],
    );
  } else {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO craft_products (
         village_id, name, product_group, start_period, is_traditional, cultural_link_level,
         materials, product_story, process_description, gift_suitability, has_experience_activity,
         experience_duration, has_demo_space, has_display_area, has_guide_staff, sales_channels, main_market
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [villageId, product.name, ...values],
    );
    productId = inserted.rows[0].id;
  }

  const internal = product.internal;
  const hasInternal = Object.values(internal).some((value) => value !== null);
  if (hasInternal) {
    const existingInternal = await client.query<{ id: string }>(
      'SELECT id FROM craft_products_internal WHERE product_id = $1',
      [productId],
    );
    const internalValues = [
      internal.averageOutputPerYear,
      internal.averageRevenuePerYear,
      internal.currentDifficulties,
      internal.supportNeeds,
    ];
    if (existingInternal.rows.length > 0) {
      await client.query(
        `UPDATE craft_products_internal SET
          average_output_per_year=$2, average_revenue_per_year=$3, current_difficulties=$4, support_needs=$5
         WHERE product_id = $1`,
        [productId, ...internalValues],
      );
    } else {
      await client.query(
        `INSERT INTO craft_products_internal (
           product_id, average_output_per_year, average_revenue_per_year, current_difficulties, support_needs
         ) VALUES ($1,$2,$3,$4,$5)`,
        [productId, ...internalValues],
      );
    }
  }
}

export async function commitImport(pool: Pool, parsed: ParsedImport): Promise<ImportCommitSummary> {
  const client = await pool.connect();
  const warnings = [...parsed.warnings];
  try {
    await client.query('BEGIN');

    let villageId: string | null = null;
    let villageAction: ImportCommitSummary['villageAction'] = 'skipped';
    if (parsed.village) {
      const result = await upsertVillage(client, parsed.village);
      villageId = result.id;
      villageAction = result.action;
    }

    const buildingIdByTempId = new Map<string, string>();
    for (const building of parsed.heritageBuildings) {
      const id = await upsertHeritageBuilding(client, building, villageId);
      buildingIdByTempId.set(building.tempId, id);
    }

    if (villageId) {
      for (const story of parsed.historyStories) {
        await upsertHistoryStory(client, villageId, story);
      }
      for (const item of parsed.intangibleHeritageItems) {
        await upsertIntangibleHeritageItem(client, villageId, item);
      }
      for (const product of parsed.craftProducts) {
        await upsertCraftProduct(client, villageId, product);
      }
    } else if (
      parsed.historyStories.length > 0 ||
      parsed.intangibleHeritageItems.length > 0 ||
      parsed.craftProducts.length > 0
    ) {
      warnings.push('Không có thông tin làng — bỏ qua lịch sử, di sản phi vật thể và sản phẩm nghề.');
    }

    let decorativeCount = 0;
    for (const item of parsed.decorativeArtItems) {
      const buildingId = buildingIdByTempId.get(item.buildingTempId);
      if (!buildingId) {
        warnings.push(`Đề tài "${item.subjectName}": không tìm thấy công trình để gán, bỏ qua.`);
        continue;
      }
      await upsertDecorativeArtItem(client, buildingId, item);
      decorativeCount++;
    }

    await client.query('COMMIT');

    return {
      villageId,
      villageAction,
      heritageBuildingCount: parsed.heritageBuildings.length,
      historyStoryCount: villageId ? parsed.historyStories.length : 0,
      decorativeArtItemCount: decorativeCount,
      intangibleHeritageItemCount: villageId ? parsed.intangibleHeritageItems.length : 0,
      craftProductCount: villageId ? parsed.craftProducts.length : 0,
      warnings,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
