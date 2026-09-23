import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { extractKmlText, parseKmlDocument, type SiteRecord } from '../lib/kmlParse.js';
import { commitKmlImport } from '../lib/kmlCommit.js';
import type { KmlCommitOptions, ParsedKmlImport } from '../lib/kmlTypes.js';
import { requireAdminKey } from '../middleware/adminAuth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});

export const adminKmlRouter = Router();

adminKmlRouter.use(requireAdminKey);

adminKmlRouter.post('/admin/import/kml/parse', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Thiếu file KML/KMZ (field "file")' });
      return;
    }

    const villageId = req.body.villageId;
    if (!villageId || typeof villageId !== 'string') {
      res.status(400).json({ error: 'Thiếu tham số villageId' });
      return;
    }

    // R15: làng được tra theo id HOẶC slug, nhưng truy vấn site bên dưới phải
    // dùng đúng cột uuid đã tra được, không truyền thẳng tham số thô vào
    // village_id (nếu không, slug sẽ ném lỗi ép kiểu uuid của Postgres).
    let villageRes;
    try {
      villageRes = await pool.query('SELECT id, name FROM villages WHERE id::text = $1 OR slug = $1', [villageId]);
    } catch (dbError) {
      console.error('[adminKml] Lỗi truy vấn làng:', dbError);
      res.status(500).json({ error: 'Không truy vấn được dữ liệu làng. Vui lòng thử lại.' });
      return;
    }

    if (villageRes.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy làng' });
      return;
    }
    const village = villageRes.rows[0];
    const villageName = village.name;

    let sitesRes;
    try {
      sitesRes = await pool.query(
        `SELECT s.id, s.name, s.category, s.position_lat, s.position_lng, s.boundary_source, hb.land_area_m2
         FROM sites s
         LEFT JOIN heritage_buildings hb ON hb.id = s.heritage_building_id
         WHERE s.village_id = $1`,
        [village.id],
      );
    } catch (dbError) {
      console.error('[adminKml] Lỗi truy vấn địa danh của làng:', dbError);
      res.status(500).json({ error: 'Không truy vấn được dữ liệu địa danh của làng. Vui lòng thử lại.' });
      return;
    }

    const villageSites: SiteRecord[] = sitesRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      position_lat: Number.parseFloat(row.position_lat),
      position_lng: Number.parseFloat(row.position_lng),
      land_area_m2: row.land_area_m2 !== null ? Number(row.land_area_m2) : null,
      boundary_source: row.boundary_source,
    }));

    const kmlText = await extractKmlText(req.file.buffer);
    // R15: parsed.villageId phải LUÔN là uuid, kể cả khi người dùng gọi bằng
    // slug, vì payload này được commit thẳng và kmlCommit dùng villageId để
    // truy vấn cột uuid. Truyền tham số thô sẽ làm commit ném 22P02.
    const parsed = parseKmlDocument(kmlText, village.id, villageName, req.file.originalname, villageSites);

    res.json(parsed);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

adminKmlRouter.post('/admin/import/kml/commit', async (req, res, next) => {
  try {
    const parsed = req.body.data as ParsedKmlImport;
    const options = req.body.options as KmlCommitOptions | undefined;

    if (!parsed || typeof parsed !== 'object' || !parsed.villageId) {
      res.status(400).json({ error: 'Dữ liệu KML không hợp lệ' });
      return;
    }

    const summary = await commitKmlImport(pool, parsed, options);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});
