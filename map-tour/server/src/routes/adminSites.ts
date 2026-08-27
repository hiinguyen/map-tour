import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { env } from '../env.js';
import { pool } from '../db.js';
import { requireAdminKey } from '../middleware/adminAuth.js';
import { listSitesForVillage, parseSiteBasicInfoInput, removeSiteImage, setSiteImage, updateSiteBasicInfo } from '../services/siteAdmin.js';

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
