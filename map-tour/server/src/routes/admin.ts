import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { env } from '../env.js';
import { pool } from '../db.js';
import { parseWorkbook } from '../lib/importParse.js';
import { commitImport } from '../lib/importCommit.js';
import type { ParsedImport } from '../lib/importTypes.js';
import { requireAdminKey } from '../middleware/adminAuth.js';
import {
  parseVillageBasicInfoInput,
  removeVillageCoverImage,
  setVillageCoverImage,
  updateVillageBasicInfo,
} from '../services/villageAdmin.js';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // survey workbooks run a few hundred KB; generous headroom for embedded images
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });

const MAX_COVER_IMAGE_BYTES = 8 * 1024 * 1024;
const COVER_IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const villageCoverUploadDir = path.join(env.uploadsDir, 'villages');
fs.mkdirSync(villageCoverUploadDir, { recursive: true });

function coverImageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile?: boolean) => void,
) {
  if (!COVER_IMAGE_EXTENSION_BY_MIME_TYPE[file.mimetype]) {
    callback(new Error('Định dạng ảnh không được hỗ trợ (chỉ nhận JPG, PNG, WEBP)'));
    return;
  }
  callback(null, true);
}

const coverImageUpload = multer({
  storage: multer.diskStorage({
    destination: villageCoverUploadDir,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${COVER_IMAGE_EXTENSION_BY_MIME_TYPE[file.mimetype] ?? ''}`);
    },
  }),
  limits: { fileSize: MAX_COVER_IMAGE_BYTES },
  fileFilter: coverImageFileFilter,
});

export const adminRouter = Router();

adminRouter.use(requireAdminKey);

adminRouter.post('/admin/import/parse', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Thiếu file Excel (field "file")' });
      return;
    }
    const workbook = new ExcelJS.Workbook();
    // exceljs pulls in a transitively older @types/node (via @fast-csv) whose
    // `Buffer` shape structurally conflicts with the project's — same value
    // at runtime, so route the cast through exceljs's own expected param type.
    await workbook.xlsx.load(req.file.buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const parsed = parseWorkbook(workbook, req.file.originalname);
    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/admin/import/commit', async (req, res, next) => {
  try {
    const parsed = req.body as ParsedImport;
    if (!parsed || typeof parsed !== 'object') {
      res.status(400).json({ error: 'Thiếu dữ liệu đã phân tích để nhập' });
      return;
    }
    const summary = await commitImport(pool, parsed);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/admin/villages/:id', async (req, res, next) => {
  try {
    const input = parseVillageBasicInfoInput(req.body);
    const updated = await updateVillageBasicInfo(pool, req.params.id, input);
    if (!updated) {
      res.status(404).json({ error: 'Không tìm thấy làng.' });
      return;
    }
    res.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'Tên làng không được để trống') {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

adminRouter.post(
  '/admin/villages/:id/cover-image',
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
      const url = `/api/uploads/villages/${req.file.filename}`;
      const result = await setVillageCoverImage(pool, req.params.id, url);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.delete('/admin/villages/:id/cover-image', async (req, res, next) => {
  try {
    await removeVillageCoverImage(pool, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
