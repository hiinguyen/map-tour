import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { env } from '../env.js';
import { pool } from '../db.js';
import { requireAdminKey } from '../middleware/adminAuth.js';
import { listSitesForVillage, parseSiteBasicInfoInput, removeSiteImage, setSiteImage, updateSiteBasicInfo } from '../services/siteAdmin.js';
import { parseBoundaryInput } from '../lib/boundaryInput.js';
import { validateRing, villageBoundsFrom } from '../lib/boundaryValidate.js';
import type { LatLng } from '../lib/geo.js';

const MAX_COVER_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PANORAMA_IMAGE_BYTES = 20 * 1024 * 1024; // panoramas are large equirectangular images
const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const siteUploadDir = path.join(env.uploadsDir, 'sites');
fs.mkdirSync(siteUploadDir, { recursive: true });

function imageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile?: boolean) => void,
) {
  if (!IMAGE_EXTENSION_BY_MIME_TYPE[file.mimetype]) {
    callback(new Error('Định dạng ảnh không được hỗ trợ (chỉ nhận JPG, PNG, WEBP)'));
    return;
  }
  callback(null, true);
}

function makeImageUpload(maxBytes: number) {
  return multer({
    storage: multer.diskStorage({
      destination: siteUploadDir,
      filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${IMAGE_EXTENSION_BY_MIME_TYPE[file.mimetype] ?? ''}`);
      },
    }),
    limits: { fileSize: maxBytes },
    fileFilter: imageFileFilter,
  });
}

const coverImageUpload = makeImageUpload(MAX_COVER_IMAGE_BYTES);
const panoramaImageUpload = makeImageUpload(MAX_PANORAMA_IMAGE_BYTES);

export const adminSitesRouter = Router();

adminSitesRouter.use(requireAdminKey);

adminSitesRouter.get('/admin/villages/:villageId/sites', async (req, res, next) => {
  try {
    const sites = await listSitesForVillage(pool, req.params.villageId);
    res.json(sites);
  } catch (error) {
    next(error);
  }
});


adminSitesRouter.post('/admin/sites/:id/boundary/preview', async (req, res, next) => {
  try {
    const rawInput = String(
      req.body?.boundaryInput ?? req.body?.rawInput ?? req.body?.raw ?? req.body?.boundary ?? req.body?.text ?? '',
    );
    const siteResult = await pool.query<{ village_id: string; heritage_building_id: string | null }>(
      'SELECT village_id, heritage_building_id FROM sites WHERE id = $1',
      [req.params.id],
    );
    const site = siteResult.rows[0];
    if (!site) {
      res.status(404).json({ error: 'Không tìm thấy điểm tham quan.' });
      return;
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

    const parsed = parseBoundaryInput(rawInput);
    if (parsed.errors.length > 0) {
      res.json({
        ring: [],
        vertexCount: 0,
        areaM2: 0,
        centroid: null,
        detectedFormat: parsed.format,
        warnings: [],
        errors: parsed.errors,
      });
      return;
    }

    const validated = validateRing(parsed.ring, { villageBounds, landAreaM2 });
    res.json({
      ring: validated.ring,
      vertexCount: validated.ring.length,
      areaM2: validated.areaM2,
      centroid: validated.centroid,
      detectedFormat: parsed.format,
      warnings: validated.warnings,
      errors: validated.errors,
    });
  } catch (error) {
    next(error);
  }
});

adminSitesRouter.delete('/admin/sites/:id/boundary', async (req, res, next) => {
  try {
    const result = await pool.query<{ id: string }>(
      `UPDATE sites SET boundary = NULL, kind = 'point', boundary_source = NULL, boundary_updated_at = NULL
       WHERE id = $1 RETURNING id`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy điểm tham quan.' });
      return;
    }
    res.json({ id: req.params.id, kind: 'point' });
  } catch (error) {
    next(error);
  }
});

adminSitesRouter.patch('/admin/sites/:id', async (req, res, next) => {
  try {
    const input = parseSiteBasicInfoInput(req.body);
    const updated = await updateSiteBasicInfo(pool, req.params.id, input);
    if (!updated) {
      res.status(404).json({ error: 'Không tìm thấy điểm tham quan.' });
      return;
    }
    res.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

adminSitesRouter.post(
  '/admin/sites/:id/cover-image',
  (req, res, next) => {
    coverImageUpload.single('file')(req, res, (error: unknown) => {
      if (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Lỗi tải ảnh lên' });
        return;
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Thiếu file ảnh (field "file")' });
        return;
      }
      const url = `/api/uploads/sites/${req.file.filename}`;
      const result = await setSiteImage(pool, req.params.id, url, 'anh');
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

adminSitesRouter.delete('/admin/sites/:id/cover-image', async (req, res, next) => {
  try {
    await removeSiteImage(pool, req.params.id, 'anh');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminSitesRouter.post(
  '/admin/sites/:id/panorama-image',
  (req, res, next) => {
    panoramaImageUpload.single('file')(req, res, (error: unknown) => {
      if (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Lỗi tải ảnh lên' });
        return;
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Thiếu file ảnh (field "file")' });
        return;
      }
      const url = `/api/uploads/sites/${req.file.filename}`;
      const result = await setSiteImage(pool, req.params.id, url, 'panorama');
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

adminSitesRouter.delete('/admin/sites/:id/panorama-image', async (req, res, next) => {
  try {
    await removeSiteImage(pool, req.params.id, 'panorama');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
