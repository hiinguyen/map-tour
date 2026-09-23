import { pool } from '../db.js';
import { toTourSite, type SiteRow } from '../lib/siteMapper.js';

type LatLng = [number, number];

interface VillageRow {
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  aliases: string[] | null;
  admin_location: string | null;
  google_maps_link: string | null;
  founded_period: string | null;
  brand_identity: string | null;
  name_meaning: string | null;
  main_occupations: string[] | null;
  natural_features: string | null;
  site_selection_history: string | null;
  morphology_description: string | null;
  morphology_image_url: string | null;
  morphology_image_attribution: string | null;
}

interface HistoryRow {
  id: string;
  type: 'lich_su' | 'su_kien' | 'phong_tuc' | 'truyen_thuyet';
  title: string;
  body_text: string | null;
  created_at: Date;
}

interface CraftRow {
  id: string;
  name: string;
  product_group: string | null;
  start_period: string | null;
  is_traditional: boolean | null;
  cultural_link_level: string | null;
  materials: string | null;
  product_story: string | null;
  process_description: string | null;
  gift_suitability: string | null;
  has_experience_activity: boolean | null;
  experience_duration: string | null;
}

interface VideoRow {
  id: string;
  url: string;
  caption: string | null;
  attribution: string | null;
}

interface HeritageBuildingPhotoJson {
  url: string;
  kind: 'anh' | 'panorama';
  caption: string | null;
  attribution: string | null;
}

interface HeritageBuildingRow {
  id: string;
  name: string;
  function: string | null;
  heritage_rank: string | null;
  heritage_rank_year: number | null;
  built_period: string | null;
  overall_structure_description: string | null;
  cultural_historical_value: string | null;
  land_area_m2: number | null;
  floor_area_m2: number | null;
  roof_material: string | null;
  roof_color: string | null;
  structure_material: string | null;
  photos: HeritageBuildingPhotoJson[];
}

function media(url: string | null, attribution: string | null) {
  return url ? { url, attribution: attribution ?? undefined } : undefined;
}

export async function findVillageDetailsBySlug(slug: string) {
  const villageResult = await pool.query<VillageRow>(
    `SELECT v.id, v.slug, v.name, v.aliases, v.admin_location, v.google_maps_link,
            v.founded_period, v.brand_identity, v.name_meaning,
            v.main_occupations, v.natural_features, v.site_selection_history,
            v.morphology_description, morphology.url AS morphology_image_url,
            morphology.attribution AS morphology_image_attribution,
            COALESCE(
              cover.url,
              (
                SELECT m.url FROM sites s
                JOIN media m ON m.id = s.cover_media_id
                WHERE s.village_id = v.id AND s.cover_media_id IS NOT NULL AND m.kind = 'anh'
                ORDER BY s.created_at
                LIMIT 1
              )
            ) AS cover_url
       FROM villages v
       LEFT JOIN media morphology ON morphology.id = v.morphology_diagram_media_id
       LEFT JOIN media cover ON cover.id = v.cover_media_id AND cover.kind = 'anh'
      WHERE v.slug = $1
      LIMIT 1`,
    [slug],
  );
  const village = villageResult.rows[0];
  if (!village) return null;

  const [sitesResult, historyResult, craftResult, videosResult, heritageBuildingsResult] = await Promise.all([
    pool.query<SiteRow>(
      `SELECT s.id, s.kind, s.name, s.category, s.short_description,
              v.name AS village_name, s.position_lat, s.position_lng, s.boundary,
              panorama.url AS panorama_url, panorama.attribution AS panorama_attribution,
              cover.url AS cover_url, cover.attribution AS cover_attribution,
              hb.land_area_m2
         FROM sites s
         JOIN villages v ON v.id = s.village_id
         LEFT JOIN heritage_buildings hb ON hb.id = s.heritage_building_id
         LEFT JOIN media panorama ON panorama.id = s.panorama_media_id
         LEFT JOIN media cover ON cover.id = s.cover_media_id AND cover.kind = 'anh'
        WHERE s.village_id = $1
        ORDER BY s.created_at, s.name`,
      [village.id],
    ),
    pool.query<HistoryRow>(
      `SELECT id, type, title, body_text, created_at
         FROM history_stories
        WHERE village_id = $1
        ORDER BY created_at, title`,
      [village.id],
    ),
    pool.query<CraftRow>(
      `SELECT id, name, product_group, start_period, is_traditional,
              cultural_link_level, materials, product_story,
              process_description, gift_suitability,
              has_experience_activity, experience_duration
         FROM craft_products
        WHERE village_id = $1
        ORDER BY created_at, name`,
      [village.id],
    ),
    pool.query<VideoRow>(
      `SELECT id, url, caption, attribution
         FROM media
        WHERE owner_entity_type = 'villages'
          AND owner_entity_id = $1
          AND kind = 'video'
        ORDER BY created_at, id`,
      [village.id],
    ),
    pool.query<HeritageBuildingRow>(
      `SELECT hb.id, hb.name, hb."function", hb.heritage_rank, hb.heritage_rank_year, hb.built_period,
              hb.overall_structure_description, hb.cultural_historical_value,
              hb.land_area_m2, hb.floor_area_m2,
              td.roof_material, td.roof_color, td.structure_material,
              photos.items AS photos
         FROM heritage_buildings hb
         LEFT JOIN heritage_building_technical_details td ON td.building_id = hb.id
         LEFT JOIN LATERAL (
           SELECT COALESCE(
                    json_agg(
                      json_build_object('url', m.url, 'kind', m.kind, 'caption', m.caption, 'attribution', m.attribution)
                      -- Ranking-certificate/plaque photos ("ảnh công nhận di tích") are
                      -- legitimate gallery content but make a poor cover/hero image (a
                      -- document, not the building) — sort them after the rest rather
                      -- than excluding them.
                      ORDER BY (m.caption ~* 'xếp hạng|công nhận'), m.kind, m.created_at
                    ),
                    '[]'
                  ) AS items
             FROM media m
            WHERE m.owner_entity_type = 'heritage_buildings' AND m.owner_entity_id = hb.id
              AND m.kind IN ('anh', 'panorama')
         ) photos ON true
        WHERE hb.village_id = $1
        ORDER BY hb.created_at, hb.name`,
      [village.id],
    ),
  ]);

  const sites = sitesResult.rows.map(toTourSite);
  const gallery = sites.flatMap((site) => (site.cover ? [{ ...site.cover, alt: site.name }] : []));
  const panoramaCount = sites.filter((site) => site.panorama).length;
  const areaCount = sites.filter((site) => site.kind === 'area').length;
  const history = historyResult.rows.map((item) => {
    const timelineMatch = item.title.match(/^(Thế kỷ|Thời |Năm |Khoảng năm )/);
    const [period, ...titleParts] = timelineMatch ? item.title.split(' — ') : [];
    return {
      id: item.id,
      type: item.type,
      title: timelineMatch && titleParts.length > 0 ? titleParts.join(' — ') : item.title,
      period: timelineMatch ? period : null,
      body: item.body_text,
    };
  });
  const overview = history.find((item) => item.title === 'Tổng quan Làng Ước Lễ')?.body ?? null;
  const traditionalCraft = history.find((item) => item.period === 'Thời nhà Mạc')?.body ?? null;
  const timelineOrder = ['Thế kỷ XVI', 'Thời nhà Mạc', 'Năm 1851', 'Năm 1928', 'Thời kỳ chống Pháp', 'Khoảng năm 2000'];
  const timeline = history
    .filter((item) => item.period)
    .sort((a, b) => timelineOrder.indexOf(a.period ?? '') - timelineOrder.indexOf(b.period ?? ''));
  const adminMatch = village.admin_location?.match(/^(.*?)\s*\(trước là\s*(.*?)\)$/i);

  return {
    id: village.id,
    slug,
    name: village.name,
    coverUrl: village.cover_url,
    aliases: village.aliases ?? [],
    adminLocation: village.admin_location,
    currentAdminLocation: adminMatch?.[1] ?? village.admin_location,
    previousAdminLocation: adminMatch?.[2] ?? null,
    googleMapsLink: village.google_maps_link,
    foundedPeriod: village.founded_period,
    brandIdentity: village.brand_identity,
    nameMeaning: village.name_meaning,
    mainOccupations: village.main_occupations ?? [],
    naturalFeatures: village.natural_features,
    siteSelectionHistory: village.site_selection_history,
    morphologyDescription: village.morphology_description,
    morphologyImage: media(village.morphology_image_url, village.morphology_image_attribution),
    overview,
    traditionalCraft,
    history,
    timeline,
    customs: history.filter((item) => item.type === 'phong_tuc'),
    legends: history.filter((item) => item.type === 'truyen_thuyet'),
    culturalStories: history.filter(
      (item) => item.type === 'su_kien' && !item.period,
    ),
    craftProducts: craftResult.rows.map((item) => ({
      id: item.id,
      name: item.name,
      productGroup: item.product_group,
      startPeriod: item.start_period,
      isTraditional: item.is_traditional,
      culturalLinkLevel: item.cultural_link_level,
      materials: item.materials,
      productStory: item.product_story,
      processDescription: item.process_description,
      giftSuitability: item.gift_suitability,
      hasExperienceActivity: item.has_experience_activity,
      experienceDuration: item.experience_duration,
    })),
    sites,
    gallery,
    videos: videosResult.rows,
    architectureHighlights: heritageBuildingsResult.rows.map((row) => {
      const photos = row.photos
        .filter((photo) => photo.kind === 'anh')
        .map((photo) => ({ url: photo.url, caption: photo.caption, attribution: photo.attribution ?? undefined }));
      const panoramaPhoto = row.photos.find((photo) => photo.kind === 'panorama');
      return {
        id: row.id,
        name: row.name,
        function: row.function,
        heritageRank: row.heritage_rank,
        heritageRankYear: row.heritage_rank_year,
        builtPeriod: row.built_period,
        overallStructureDescription: row.overall_structure_description,
        culturalHistoricalValue: row.cultural_historical_value,
        landAreaM2: row.land_area_m2,
        floorAreaM2: row.floor_area_m2,
        roofMaterial: row.roof_material,
        roofColor: row.roof_color,
        structureMaterial: row.structure_material,
        cover: photos[0],
        photos,
        panorama: media(panoramaPhoto?.url ?? null, panoramaPhoto?.attribution ?? null),
      };
    }),
    statistics: {
      siteCount: sites.length,
      pointCount: sites.length - areaCount,
      areaCount,
      panoramaCount,
      imageCount: gallery.length,
    },
  };
}
