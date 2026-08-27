import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdminKey } from '../middleware/adminAuth.js';
import { deleteMediaRow, listGenericEntities, listGenericRows, updateGenericRow, updateMediaRow } from '../services/genericAdmin.js';

export const adminGenericRouter = Router();

adminGenericRouter.use(requireAdminKey);

adminGenericRouter.get('/admin/generic-entities', (_req, res) => {
  res.json(listGenericEntities());
});

adminGenericRouter.get('/admin/generic/:key', async (req, res, next) => {
  try {
    const rawSearch = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const search = rawSearch.length > 0 ? rawSearch : null;
    const rows = await listGenericRows(pool, req.params.key, search);
    if (rows === null) {
      res.status(404).json({ error: 'Không tìm thấy loại dữ liệu.' });
      return;
    }
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

adminGenericRouter.patch('/admin/generic/:key/:id', async (req, res, next) => {
  try {
    const fields = req.body?.fields;
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
      res.status(400).json({ error: 'Thiếu dữ liệu cập nhật.' });
      return;
    }
    const updated = await updateGenericRow(pool, req.params.key, req.params.id, fields as Record<string, unknown>);
    if (!updated) {
      res.status(404).json({ error: 'Không tìm thấy loại dữ liệu hoặc bản ghi.' });
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

adminGenericRouter.patch('/admin/media/:id', async (req, res, next) => {
  try {
    const updated = await updateMediaRow(pool, req.params.id, {
      url: req.body?.url,
      caption: req.body?.caption,
      attribution: req.body?.attribution,
    });
    if (!updated) {
      res.status(404).json({ error: 'Không tìm thấy media.' });
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

adminGenericRouter.delete('/admin/media/:id', async (req, res, next) => {
  try {
    const wasDeleted = await deleteMediaRow(pool, req.params.id);
    if (!wasDeleted) {
      res.status(404).json({ error: 'Không tìm thấy media.' });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
