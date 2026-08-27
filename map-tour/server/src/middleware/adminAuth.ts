import type { NextFunction, Request, Response } from 'express';
import { env } from '../env.js';

export function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  if (!env.adminImportKey) {
    res.status(503).json({ error: 'Chức năng quản trị chưa được bật (thiếu ADMIN_IMPORT_KEY trên server)' });
    return;
  }
  const providedKey = req.header('x-admin-key');
  if (providedKey !== env.adminImportKey) {
    res.status(401).json({ error: 'Sai khóa quản trị' });
    return;
  }
  next();
}
