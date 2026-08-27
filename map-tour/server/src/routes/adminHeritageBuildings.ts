import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { env } from '../env.js';
import { pool } from '../db.js';
import { requireAdminKey } from '../middleware/adminAuth.js';
import {
  addHeritageBuildingPhoto,
  listHeritageBuildingsForVillage,
  parseHeritageBuildingInput,
  updateHeritageBuilding,
} from '../services/heritageBuildingAdmin.js';

const MAX_HERITAGE_PHOTO_BYTES = 20 * 1024 * 1024;
const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const heritageBuildingUploadDir = path.join(env.uploadsDir, 'heritage-buildings');
fs.mkdirSync(heritageBuildingUploadDir, { recursive: true });

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

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: heritageBuildingUploadDir,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${IMAGE_EXTENSION_BY_MIME_TYPE[file.mimetype] ?? ''}`);
    },
  }),
  limits: { fileSize: MAX_HERITAGE_PHOTO_BYTES },
  fileFilter: imageFileFilter,
});

export const adminHeritageBuildingsRouter = Router();

adminHeritageBuildingsRouter.use(requireAdminKey);

adminHeritageBuildingsRouter.get('/admin/villages/:villageId/heritage-buildings', async (req, res, next) => {
  try {
    const buildings = await listHeritageBuildingsForVillage(pool, req.params.villageId);
    res.json(buildings);
  } catch (error) {
    next(error);
  }
});

adminHeritageBuildingsRouter.patch('/admin/heritage-buildings/:id', async (req, res, next) => {
  try {
    const { building, technicalDetails } = parseHeritageBuildingInput(req.body);
    const updated = await updateHeritageBuilding(pool, req.params.id, building, technicalDetails);
    if (!updated) {
      res.status(404).json({ error: 'Không tìm thấy công trình.' });
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

adminHeritageBuildingsRouter.post(
  '/admin/heritage-buildings/:id/photos',
  (req, res, next) => {
    photoUpload.single('file')(req, res, (error: unknown) => {
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
      const requestedKind = req.body?.kind;
      if (requestedKind !== undefined && requestedKind !== 'anh' && requestedKind !== 'panorama') {
        res.status(400).json({ error: 'Loại ảnh không hợp lệ (chỉ nhận "anh" hoặc "panorama")' });
        return;
      }
      const kind: 'anh' | 'panorama' = requestedKind === 'panorama' ? 'panorama' : 'anh';
      const url = `/api/uploads/heritage-buildings/${req.file.filename}`;
      const photo = await addHeritageBuildingPhoto(pool, req.params.id, url, kind);
      res.json(photo);
    } catch (error) {
      next(error);
    }
  },
);
