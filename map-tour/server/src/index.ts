import cors from 'cors';
import express from 'express';
import { env } from './env.js';
import { sitesRouter } from './routes/sites.js';
import { villagesRouter } from './routes/villages.js';
import { routingRouter } from './routes/routing.js';
import { adminRouter } from './routes/admin.js';
import { adminSitesRouter } from './routes/adminSites.js';
import { adminHeritageBuildingsRouter } from './routes/adminHeritageBuildings.js';
import { adminGenericRouter } from './routes/adminGeneric.js';
import { adminKmlRouter } from './routes/adminKml.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});
// Serves admin-uploaded files (village cover images) — mounted under /api so
// the existing "/api -> backend" proxy rule (vite.config.ts dev server,
// reverse proxy in production) covers it with no extra proxy config needed.
app.use('/api/uploads', express.static(env.uploadsDir));
app.use('/api', sitesRouter);
app.use('/api', villagesRouter);
app.use('/api', routingRouter);
app.use('/api', adminRouter);
app.use('/api', adminSitesRouter);
app.use('/api', adminHeritageBuildingsRouter);
app.use('/api', adminGenericRouter);
app.use('/api', adminKmlRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.apiPort, () => {
  console.log(`map-tour API listening on http://localhost:${env.apiPort}`);
});
