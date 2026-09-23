import { Router } from 'express';
import { pool } from '../db.js';
import { toTourSite, type SiteRow } from '../lib/siteMapper.js';

const SITES_QUERY = `
  SELECT
    s.id,
    s.kind,
    s.name,
    s.category,
    s.short_description,
    v.name AS village_name,
    s.position_lat,
    s.position_lng,
    s.boundary,
    m.url AS panorama_url,
    m.attribution AS panorama_attribution,
    cover.url AS cover_url,
    cover.attribution AS cover_attribution,
    hb.land_area_m2
  FROM sites s
  JOIN villages v ON v.id = s.village_id
  LEFT JOIN heritage_buildings hb ON hb.id = s.heritage_building_id
  LEFT JOIN media m ON m.id = s.panorama_media_id
  LEFT JOIN media cover ON cover.id = s.cover_media_id AND cover.kind = 'anh'
  WHERE v.slug = $1
  ORDER BY s.created_at
`;

export const sitesRouter = Router();

sitesRouter.get('/villages/:slug/sites', async (req, res, next) => {
  try {
    const result = await pool.query<SiteRow>(SITES_QUERY, [req.params.slug]);
    res.json(result.rows.map(toTourSite));
  } catch (error) {
    next(error);
  }
});
