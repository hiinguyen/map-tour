import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { ParsedKmlImport } from '../lib/kmlTypes.js';

// pool được mock để route chạy được mà không cần Postgres thật.
// vi.hoisted giữ các biến mock sống sót qua bước hoisting của vi.mock.
const { queryMock, connectMock, clientQueryMock, releaseMock } = vi.hoisted(() => {
  const queryMock = vi.fn();
  const clientQueryMock = vi.fn();
  const releaseMock = vi.fn();
  const connectMock = vi.fn(async () => ({ query: clientQueryMock, release: releaseMock }));
  return { queryMock, connectMock, clientQueryMock, releaseMock };
});

vi.mock('../db.js', () => ({
  pool: { query: queryMock, connect: connectMock },
}));

// env.ts đòi POSTGRES_DB/USER/PASSWORD và gọi dotenv; mock để test thuần.
vi.mock('../env.js', () => ({
  env: {
    postgresHost: '127.0.0.1',
    postgresPort: 5432,
    postgresDb: 'test',
    postgresUser: 'test',
    postgresPassword: 'test',
    apiPort: 0,
    corsOrigin: 'http://localhost:5173',
    osrmUrl: 'http://osrm:5000',
    adminImportKey: 'test-admin-key',
    uploadsDir: '/tmp',
  },
}));

import { adminKmlRouter } from './adminKml.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VILLAGE_UUID = '11111111-2222-3333-4444-555555555555';

// Polygon bao đúng ghim site bên dưới nên khớp tự tin (điểm trong hình 100
// cộng tên trùng khớp 80), đủ để payload commit có một dòng matched.
const MATCH_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Đình làng Ước Lễ</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              105.8100,20.8260,0
              105.8110,20.8260,0
              105.8110,20.8270,0
              105.8100,20.8270,0
              105.8100,20.8260,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

const SITE_ROW = {
  id: '99999999-8888-7777-6666-555555555555',
  name: 'Đình làng Ước Lễ',
  category: 'Di tích tín ngưỡng',
  position_lat: 20.8265,
  position_lng: 105.8105,
  boundary_source: null,
  land_area_m2: null,
};

let server: Server;
let baseUrl: string;

function mockVillageAndSites(): void {
  queryMock.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM villages')) {
      return { rows: [{ id: VILLAGE_UUID, name: 'Làng Ước Lễ' }] };
    }
    return { rows: [SITE_ROW] };
  });
}

function postParse(villageId: string): Promise<Response> {
  const form = new FormData();
  form.append('file', new Blob([MATCH_KML], { type: 'application/xml' }), 'test.kml');
  form.append('villageId', villageId);
  return fetch(`${baseUrl}/api/admin/import/kml/parse`, {
    method: 'POST',
    headers: { 'x-admin-key': 'test-admin-key' },
    body: form,
  });
}

function postCommit(data: ParsedKmlImport): Promise<Response> {
  return fetch(`${baseUrl}/api/admin/import/kml/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': 'test-admin-key' },
    body: JSON.stringify({ data }),
  });
}

// Fake client cho commitKmlImport. Mọi truy vấn có tham số village_id phải
// nhận đúng uuid; nếu nhận slug thì ném lỗi 22P02 giống Postgres thật.
function installFakeCommitClient(): void {
  clientQueryMock.mockImplementation(async (sql: string, params?: unknown[]) => {
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)\b/i.test(sql)) return { rows: [] };
    if (sql.includes('village_id')) {
      const value = params?.[0];
      if (typeof value !== 'string' || !UUID_RE.test(value)) {
        const error = new Error(`invalid input syntax for type uuid: "${String(value)}"`) as Error & { code?: string };
        error.code = '22P02';
        throw error;
      }
      if (sql.includes('position_lat')) {
        return { rows: [{ position_lat: 20.8265, position_lng: 105.8105 }] };
      }
      return { rows: [] };
    }
    if (sql.includes('SELECT boundary_source FROM sites')) {
      return { rows: [{ boundary_source: null }] };
    }
    return { rows: [] };
  });
}

describe('POST /api/admin/import/kml', () => {
  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', adminKmlRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  beforeEach(() => {
    queryMock.mockReset();
    clientQueryMock.mockReset();
    releaseMock.mockReset();
    connectMock.mockClear();
  });

  it('R15: gọi bằng slug trả villageId là uuid và truy vấn site bằng uuid', async () => {
    mockVillageAndSites();

    const response = await postParse('lang-uoc-le');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { villageId: string };
    // Không được giữ slug: payload này sẽ được commit thẳng.
    expect(body.villageId).toBe(VILLAGE_UUID);

    // Lần gọi thứ hai (truy vấn site) phải dùng uuid đã tra, không phải slug thô.
    expect(queryMock).toHaveBeenCalledTimes(2);
    const sitesCallArgs = queryMock.mock.calls[1][1] as unknown[];
    expect(sitesCallArgs).toEqual([VILLAGE_UUID]);
  });

  it('R15: payload parse bằng slug giống hệt payload parse bằng uuid', async () => {
    mockVillageAndSites();

    const slugResponse = await postParse('lang-uoc-le');
    const uuidResponse = await postParse(VILLAGE_UUID);

    expect(slugResponse.status).toBe(200);
    expect(uuidResponse.status).toBe(200);
    const slugPayload = (await slugResponse.json()) as ParsedKmlImport;
    const uuidPayload = (await uuidResponse.json()) as ParsedKmlImport;
    expect(slugPayload).toEqual(uuidPayload);
  });

  it('R15: parse bằng slug rồi commit payload đó không ném 22P02', async () => {
    mockVillageAndSites();
    installFakeCommitClient();

    const parseResponse = await postParse('lang-uoc-le');
    expect(parseResponse.status).toBe(200);
    const payload = (await parseResponse.json()) as ParsedKmlImport;

    const commitResponse = await postCommit(payload);

    expect(commitResponse.status).toBe(200);
    const summary = (await commitResponse.json()) as { updatedCount: number; skippedUnselectedCount: number };
    expect(summary.updatedCount).toBe(1);
    expect(summary.skippedUnselectedCount).toBe(0);
  });

  it('R15: lỗi Postgres không lộ chi tiết nội bộ ra phản hồi', async () => {
    queryMock.mockRejectedValueOnce(
      new Error('invalid input syntax for type uuid: "lang-uoc-le"'),
    );

    const response = await postParse('lang-uoc-le');

    expect(response.status).toBeGreaterThanOrEqual(500);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeTruthy();
    expect(body.error ?? '').not.toMatch(/uuid|syntax|postgres|invalid input|type/i);
    // Thông báo phải là tiếng Việt hướng người dùng.
    expect(body.error ?? '').toMatch(/[ăâđêôơưáàảãạếệ]/i);
  });
});
