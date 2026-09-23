import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';
import { extractKmlText, parseKmlDocument, type SiteRecord } from '../src/lib/kmlParse.js';
import { commitKmlImport } from '../src/lib/kmlCommit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const isDryRun = process.argv.includes('--dry-run');

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/import-kml.ts <village-id-or-slug> <kml-or-kmz-path> [--dry-run]');
    process.exitCode = 1;
    return;
  }

  const villageArg = args[0];
  const fileArg = args[1];
  const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(PROJECT_ROOT, fileArg);
  const fileName = path.basename(filePath);

  const villageRes = await pool.query(
    'SELECT id, name, slug FROM villages WHERE slug = $1 OR id::text = $1',
    [villageArg],
  );


  if (villageRes.rows.length === 0) {
    console.error(`Không tìm thấy làng với ID hoặc slug: ${villageArg}`);
    process.exitCode = 1;
    await pool.end();
    return;
  }

  const village = villageRes.rows[0];
  console.log(`Đang nạp file KML/KMZ cho làng: ${village.name} (${village.slug})`);
  console.log(`File: ${filePath}`);

  const buffer = fs.readFileSync(filePath);
  const kmlText = await extractKmlText(buffer);

  const sitesRes = await pool.query(
    `SELECT s.id, s.name, s.category, s.position_lat, s.position_lng, s.boundary_source, hb.land_area_m2
     FROM sites s
     LEFT JOIN heritage_buildings hb ON hb.id = s.heritage_building_id
     WHERE s.village_id = $1`,
    [village.id],
  );

  const villageSites: SiteRecord[] = sitesRes.rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    position_lat: Number.parseFloat(row.position_lat),
    position_lng: Number.parseFloat(row.position_lng),
    land_area_m2: row.land_area_m2 !== null ? Number(row.land_area_m2) : null,
    boundary_source: row.boundary_source,
  }));

  const parsed = parseKmlDocument(kmlText, village.id, village.name, fileName, villageSites);

  console.log('\n--- KẾT QUẢ PARSE KML ---');
  console.log(`Tổng polygon: ${parsed.counts.totalPolygons}`);
  console.log(`Khớp tự tin (confident): ${parsed.counts.matchedCount}`);
  console.log(`Khớp yếu (ambiguous): ${parsed.counts.ambiguousCount}`);
  console.log(`Chưa khớp (unmatched): ${parsed.counts.unmatchedCount}`);
  console.log(`Không hỗ trợ (unsupported): ${parsed.counts.unsupportedCount}`);
  console.log(`Từ chối (rejected): ${parsed.counts.rejectedCount}`);
  console.log(`Số LineString: ${parsed.counts.lineStringCount}`);
  console.log(`Số Point: ${parsed.counts.pointCount}`);

  if (parsed.matched.length > 0) {
    console.log('\n--- Danh sách khớp tự tin ---');
    for (const m of parsed.matched) {
      console.log(`- ${m.placemarkName} -> ${m.siteName} (điểm: ${m.score}, diện tích: ${Math.round(m.areaM2)} m²)`);
    }
  }

  if (isDryRun) {
    console.log('\nChế độ --dry-run: Không ghi vào CSDL.');
    await pool.end();
    return;
  }

  const summary = await commitKmlImport(pool, parsed);
  console.log('\n--- KẾT QUẢ COMMIT ---');
  console.log(`Số site cập nhật: ${summary.updatedCount}`);
  console.log(`Số site mới tạo: ${summary.createdCount}`);
  console.log(`Số site được bảo vệ (admin edit): ${summary.protectedCount}`);
  console.log(`Tổng số đã xử lý: ${summary.totalProcessed}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
