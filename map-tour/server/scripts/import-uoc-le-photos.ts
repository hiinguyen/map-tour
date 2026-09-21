// One-off data-population script for "Ước Lễ.xlsx": like the Cự Đà workbook,
// its drawing parts hold no embedded images — every photo is a Google Drive
// share link attached as a cell hyperlink (many decorative-item rows link to
// a whole Drive *folder* instead of a single file; those aren't directly
// downloadable and are silently skipped by driveFileId()/downloadDriveFile()).
//
// Site-name matching: the workbook's site/building labels don't always match
// the `sites.name` strings verbatim (survey notes vs. the DB's own naming
// pass). Matches below only cover cases resolved with reasonable confidence:
//   - "Chùa Sổ" (sheet 4.2's full architecture write-up) and "Chùa Sùng Phúc"
//     (sheet 2's separate quick-list row) are treated as the SAME site
//     (`Chùa Sùng Phúc`) — Chùa Sổ is the common/geographic name for Sùng
//     Phúc Tự, the pagoda in the "Cụm di tích Ước Lễ - Sổ" heritage cluster;
//     this mirrors the same kind of same-pin-two-labels merge already made
//     for Cự Đà's "Cổng làng"/"Chùa" sites (see import-cu-da-photos.ts).
//   - "Nhà Cổ không biết tên" -> `Nhà cổ khum biếc tên` ("khum biếc tên" is a
//     transcription slip for "không biết tên", i.e. "unnamed old house").
//   - Sheets "4.3. Kiến trúc nhà cụ Khả" and "4.4. Kiến trúc nhà bà Bào" (plus
//     their "hiện vật" sub-sheets) describe houses with NO matching site row
//     in the current `sites` table (nothing named after "cụ Khả" or "bà Bào"
//     exists) — creating new sites needs real coordinates this sheet doesn't
//     provide, so these are intentionally left out; see the run's warning
//     log for the exact counts skipped.
//
// Usage: npx tsx scripts/import-uoc-le-photos.ts [--dry-run] [--limit=N]
//   --dry-run   download and save files, but skip all DB writes
//   --limit=N   stop after N photo tasks (smoke-testing)
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { pool } from '../src/db.js';
import { extractLabeledRows, valueByLastSegment } from '../src/lib/excelExtract.js';
import { slugifyVietnamese } from '../src/lib/slugify.js';
import { driveFileId, downloadDriveFile, isEquirectangular } from './lib/drivePhoto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, '../../../Ước Lễ.xlsx');
const PUBLIC_DIR = path.resolve(__dirname, '../../public/uoc-le');
const VILLAGE_NAME = 'Làng Ước Lễ';

const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

interface PhotoTask {
  siteName: string;
  driveUrl: string;
  caption: string | null;
  isPanorama: boolean;
}

function cellPlainText(cell: ExcelJS.Cell): string {
  const raw = cell.value as unknown;
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'object') {
    const obj = raw as { richText?: Array<{ text: string }>; text?: string };
    if (Array.isArray(obj.richText)) return obj.richText.map((part) => part.text).join('').trim();
    if (typeof obj.text === 'string') return obj.text.trim();
    return '';
  }
  return String(raw).trim();
}

function cellDriveUrl(cell: ExcelJS.Cell): string | null {
  const raw = cell.value as unknown;
  if (raw && typeof raw === 'object' && 'hyperlink' in raw) {
    const hyperlink = (raw as { hyperlink?: string }).hyperlink;
    if (hyperlink && /drive\.google\.com\/file\/d\//.test(hyperlink)) return hyperlink;
  }
  return null;
}

const TRIVIAL_CAPTION_WORDS = new Set(['ảnh', 'anh', 'vị trí', 'vi tri', 'bản đồ']);

function meaningfulCaption(...candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    const text = candidate?.trim();
    if (text && !TRIVIAL_CAPTION_WORDS.has(text.toLowerCase())) return text;
  }
  return null;
}

function rowText(row: ExcelJS.Row, upToCol: number): string {
  const parts: string[] = [];
  for (let c = 1; c <= upToCol; c++) {
    const text = cellPlainText(row.getCell(c));
    if (text) parts.push(text);
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Sheet "2. Bản đồ tổng thể của làng" — one row per POI photo (column 4),
// hand-picked by row number for entries that resolve to an existing site
// with reasonable confidence. Several wells ("giếng ...") are attached as
// bonus photos on the building whose grounds they sit in rather than as
// their own site, since only "Giếng Ngõ Phát" exists as a standalone site.
const SHEET2_NAME = '2. Bản đồ tổng thể của làng';
const SHEET2_ENTRIES: Array<{ row: number; siteName: string }> = [
  { row: 10, siteName: 'Đường gạch khá đẹp' },
  { row: 20, siteName: 'Quán Mới' },
  { row: 22, siteName: 'Điếm Tuần' },
  { row: 26, siteName: 'Cổng làng Ước Lễ' },
  { row: 27, siteName: 'Cổng làng Ước Lễ' },
  { row: 29, siteName: 'Cổng Sau Làng Ước Lễ' },
  { row: 39, siteName: 'Đình làng Ước Lễ' },
  { row: 41, siteName: 'Chùa Sùng Phúc' }, // "Chùa Sổ" label — same pagoda, see header note
  { row: 43, siteName: 'Chùa Sùng Phúc' },
  { row: 45, siteName: 'Chùa Hậu' },
  { row: 47, siteName: 'Nhà Thờ Giáo Họ' },
  { row: 49, siteName: 'Đền Ngõ Họ' }, // "Miếu ... cạnh nhà thờ giáo họ"
  { row: 53, siteName: 'Đền Chợ' },
  { row: 65, siteName: 'Nhà Bà Vân siêu cổ' },
  { row: 67, siteName: 'Nhà cổ khum biếc tên' }, // "Nhà Cổ không biết tên"
  { row: 69, siteName: 'Nhà Cổ (nhà Cụ Sẩm)' },
  { row: 79, siteName: 'Chùa Sùng Phúc' }, // giếng chùa Sùng Phúc — bonus
  { row: 81, siteName: 'Nhà Thờ Giáo Họ' }, // giếng nhà thờ — bonus
  { row: 83, siteName: 'Chùa Hậu' }, // giếng chùa Hậu — bonus
  { row: 85, siteName: 'Chùa Sùng Phúc' }, // giếng chùa Sổ — bonus
  { row: 87, siteName: 'Giếng Ngõ Phát' },
  { row: 89, siteName: 'Nhà Thờ Giáo Họ' }, // giếng - nhà thờ — bonus
];

function collectSheet2Tasks(worksheet: ExcelJS.Worksheet, warnings: string[]): PhotoTask[] {
  const tasks: PhotoTask[] = [];
  for (const entry of SHEET2_ENTRIES) {
    const row = worksheet.getRow(entry.row);
    const cell = row.getCell(4);
    const driveUrl = cellDriveUrl(cell);
    if (!driveUrl) {
      warnings.push(`Sheet "2.": dòng ${entry.row} — không tìm thấy link ảnh cho "${entry.siteName}".`);
      continue;
    }
    tasks.push({
      siteName: entry.siteName,
      driveUrl,
      caption: meaningfulCaption(cellPlainText(cell)),
      isPanorama: /360/.test(rowText(row, 6)),
    });
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// Building architecture sheets ("4.1"/"4.2"): every photo becomes a gallery
// photo for the fixed target site — link sits in column 3, caption comes
// from the column-2 fill-down section label plus the cell's own text. Rows
// whose only label is the shared "Vị trí" overview-map screenshot (reused
// verbatim across all four building sheets) are skipped as non-content.
function collectArchitectureSheetTasks(
  worksheet: ExcelJS.Worksheet,
  targetSiteName: string,
  warnings: string[],
): PhotoTask[] {
  const tasks: PhotoTask[] = [];
  const seenFileIds = new Set<string>();
  let carryLabel = '';
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const label = cellPlainText(row.getCell(2));
    if (label) carryLabel = label;
    if (carryLabel.trim().toLowerCase() === 'vị trí') continue;
    const dataCell = row.getCell(3);
    const driveUrl = cellDriveUrl(dataCell);
    if (!driveUrl) continue;
    const fileId = driveFileId(driveUrl);
    if (!fileId || seenFileIds.has(fileId)) continue;
    seenFileIds.add(fileId);
    const ownText = meaningfulCaption(cellPlainText(dataCell));
    const caption =
      [carryLabel || null, ownText && ownText !== carryLabel ? ownText : null].filter(Boolean).join(' — ') || null;
    tasks.push({ siteName: targetSiteName, driveUrl, caption, isPanorama: /360/.test(rowText(row, 6)) });
  }
  if (tasks.length === 0) warnings.push(`Sheet "${worksheet.name}": không có ảnh trực tiếp nào (chỉ link folder?).`);
  return tasks;
}

// ---------------------------------------------------------------------------
// Decorative/"hiện vật" sub-sheets ("4.1.1"/"4.2.1"): 3-level carry-down
// label (theme group / subgroup / subject), link in column 4. Most rows here
// link to a whole Drive folder rather than a single file and are skipped.
function collectHienVatSheetTasks(
  worksheet: ExcelJS.Worksheet,
  targetSiteName: string,
  warnings: string[],
): PhotoTask[] {
  const tasks: PhotoTask[] = [];
  const seenFileIds = new Set<string>();
  const carry = ['', '', ''];
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 3; c++) {
      const text = cellPlainText(row.getCell(c));
      if (text) carry[c - 1] = text;
    }
    const subject = carry[2].trim();
    if (!subject || subject.toLowerCase() === 'link') continue;
    const dataCell = row.getCell(4);
    const driveUrl = cellDriveUrl(dataCell);
    if (!driveUrl) continue;
    const fileId = driveFileId(driveUrl);
    if (!fileId || seenFileIds.has(fileId)) continue;
    seenFileIds.add(fileId);
    const ownText = meaningfulCaption(cellPlainText(dataCell));
    const caption = [subject, ownText && ownText !== subject ? ownText : null].filter(Boolean).join(' — ') || null;
    tasks.push({ siteName: targetSiteName, driveUrl, caption, isPanorama: /360/.test(rowText(row, 6)) });
  }
  if (tasks.length === 0) {
    warnings.push(`Sheet "${worksheet.name}": không có ảnh trực tiếp nào (chỉ link folder), bỏ qua.`);
  }
  return tasks;
}

// A photo is 360° only when its OWN label/caption says so ("Ảnh 360", "ảnh
// 360 từ cạnh bên", ...) — the row's full instructional text (rowText upTo
// col 6, used by isPanorama above) repeats boilerplate survey guidance
// mentioning "360" on every row of the "Ảnh các góc chính"/"Ảnh trong nhà"
// sections, which produces false positives on ordinary photos. Kept separate
// from the (looser) `isPanorama` flag already used above for `sites` media —
// those rows are already imported and this task doesn't touch them.
function isPanoramaLabel(...labels: string[]): boolean {
  return labels.some((label) => /360/.test(label));
}

interface BuildingPhotoTask {
  buildingId: string;
  buildingLabel: string;
  driveUrl: string;
  caption: string | null;
  isPanorama: boolean;
}

async function resolveBuildingId(client: PoolClient, villageId: string, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    'SELECT id FROM heritage_buildings WHERE village_id = $1 AND name = $2',
    [villageId, name],
  );
  return result.rows[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Building architecture sheets ("4.1"–"4.4"): every photo becomes a gallery
// photo attached directly to the heritage_buildings row (mirrors
// collectBuildingTasks in import-cu-da-photos.ts). Separate from
// collectArchitectureSheetTasks above, which attaches the SAME sheets'
// photos to a `sites` row instead — kept for the map/360-experience feature
// that already consumed sheets 4.1/4.2 before heritage_buildings existed for
// this village (see migrations/012). The "Kiến trúc độc đáo" page reads only
// from heritage_buildings-owned media, which was empty for all 4 buildings.
async function collectBuildingPhotoTasks(
  client: PoolClient,
  villageId: string,
  worksheet: ExcelJS.Worksheet,
  warnings: string[],
): Promise<BuildingPhotoTask[]> {
  const rows = extractLabeledRows(worksheet);
  const buildingName = valueByLastSegment(rows, 'Tên');
  if (!buildingName) {
    warnings.push(`Sheet "${worksheet.name}": không tìm thấy "Tên" công trình (heritage_buildings), bỏ qua ảnh.`);
    return [];
  }
  const buildingId = await resolveBuildingId(client, villageId, buildingName);
  if (!buildingId) {
    warnings.push(
      `Sheet "${worksheet.name}": không tìm thấy công trình "${buildingName}" trong heritage_buildings, bỏ qua ảnh.`,
    );
    return [];
  }

  const tasks: BuildingPhotoTask[] = [];
  const seenFileIds = new Set<string>();
  let carryLabel = '';
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const label = cellPlainText(row.getCell(2));
    if (label) carryLabel = label;
    if (carryLabel.trim().toLowerCase() === 'vị trí') continue;
    const dataCell = row.getCell(3);
    const driveUrl = cellDriveUrl(dataCell);
    if (!driveUrl) continue;
    const fileId = driveFileId(driveUrl);
    if (!fileId || seenFileIds.has(fileId)) continue;
    seenFileIds.add(fileId);
    const rawOwnText = cellPlainText(dataCell);
    const ownText = meaningfulCaption(rawOwnText);
    const caption =
      [carryLabel || null, ownText && ownText !== carryLabel ? ownText : null].filter(Boolean).join(' — ') || null;
    tasks.push({
      buildingId,
      buildingLabel: buildingName,
      driveUrl,
      caption,
      isPanorama: isPanoramaLabel(carryLabel, rawOwnText),
    });
  }
  return tasks;
}

async function mediaAlreadyExistsForBuilding(client: PoolClient, buildingId: string, url: string): Promise<boolean> {
  const result = await client.query(
    "SELECT 1 FROM media WHERE owner_entity_type = 'heritage_buildings' AND owner_entity_id = $1 AND url = $2",
    [buildingId, url],
  );
  return (result.rowCount ?? 0) > 0;
}

async function processBuildingPhotoTask(
  client: PoolClient,
  task: BuildingPhotoTask,
  indexByBuilding: Map<string, number>,
): Promise<'inserted' | 'skipped-exists' | 'skipped-download' | 'error'> {
  const fileId = driveFileId(task.driveUrl);
  if (!fileId) return 'skipped-download';

  const slug = `${slugifyVietnamese(task.buildingLabel) || 'anh'}-${task.buildingId.slice(0, 8)}`;
  const nextIndex = (indexByBuilding.get(task.buildingId) ?? 0) + 1;
  indexByBuilding.set(task.buildingId, nextIndex);

  try {
    const downloaded = await downloadDriveFile(fileId);
    if (!downloaded) {
      console.warn(`  [bỏ qua] không tải được ${task.driveUrl} (${task.buildingLabel})`);
      return 'skipped-download';
    }

    // Geometry, not the workbook label, decides 360°: see isEquirectangular()
    // in lib/drivePhoto.ts. Surveyors' "360" labels produced both false
    // positives and misses across these workbooks (migrations/014), so the
    // real pixels win — a disagreement is logged as a data-entry warning.
    const isPanorama = isEquirectangular(downloaded);
    if (task.isPanorama !== isPanorama) {
      console.warn(
        `  [nhãn lệch] ${task.buildingLabel}: workbook ghi "${task.isPanorama ? '360' : 'ảnh thường'}" nhưng ảnh thật là "${isPanorama ? '360 (2:1)' : 'ảnh thường'}" — lấy theo ảnh thật.`,
      );
    }
    const kind = isPanorama ? 'panorama' : downloaded.kind;
    const fileName = `${slug}-${nextIndex}.${downloaded.extension}`;
    const relativeUrl = `/uoc-le/heritage-buildings/${fileName}`;
    const absolutePath = path.join(PUBLIC_DIR, 'heritage-buildings', fileName);

    if (await mediaAlreadyExistsForBuilding(client, task.buildingId, relativeUrl)) {
      return 'skipped-exists';
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, downloaded.buffer);

    if (!DRY_RUN) {
      await client.query(
        `INSERT INTO media (url, kind, caption, owner_entity_type, owner_entity_id)
         VALUES ($1, $2, $3, 'heritage_buildings', $4)`,
        [relativeUrl, kind, task.caption, task.buildingId],
      );
    }

    console.log(
      `  [ok] ${task.buildingLabel} -> ${relativeUrl} (${kind})${task.caption ? ` ("${task.caption}")` : ''}`,
    );
    return 'inserted';
  } catch (error) {
    console.error(`  [lỗi] ${task.driveUrl} (${task.buildingLabel}):`, error instanceof Error ? error.message : error);
    return 'error';
  }
}

// ---------------------------------------------------------------------------
// Sheet "6. Di sản văn hóa phi vật thể" — single craft-recognition photo.
function collectIntangibleHeritageTasks(worksheet: ExcelJS.Worksheet, warnings: string[]): PhotoTask[] {
  const row = worksheet.getRow(39);
  const cell = row.getCell(4);
  const driveUrl = cellDriveUrl(cell);
  if (!driveUrl) {
    warnings.push(`Sheet "${worksheet.name}": dòng 39 — không tìm thấy ảnh công nhận làng nghề.`);
    return [];
  }
  return [
    {
      siteName: 'Khu làng nghề giò chả',
      driveUrl,
      caption: meaningfulCaption(cellPlainText(cell)) ?? 'Ảnh công nhận làng nghề',
      isPanorama: false,
    },
  ];
}

// ---------------------------------------------------------------------------
async function resolveSiteId(client: PoolClient, villageId: string, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>('SELECT id FROM sites WHERE village_id = $1 AND name = $2', [
    villageId,
    name,
  ]);
  return result.rows[0]?.id ?? null;
}

// Sites whose current media is a placeholder CC0 stock photo (from
// migrations 001/002) — cleared before import so the real photos found here
// fully replace them rather than sitting alongside stock filler.
const SITES_TO_REPLACE = [
  'Cổng làng Ước Lễ',
  'Đình làng Ước Lễ',
  'Chùa Sùng Phúc',
  'Giếng Ngõ Phát',
  'Khu làng nghề giò chả',
];

async function clearExistingMedia(client: PoolClient, villageId: string, warnings: string[]): Promise<void> {
  for (const siteName of SITES_TO_REPLACE) {
    const siteId = await resolveSiteId(client, villageId, siteName);
    if (!siteId) {
      warnings.push(`Không tìm thấy site "${siteName}" để xoá ảnh cũ.`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  [dry-run] sẽ xoá ảnh cũ của "${siteName}" (${siteId})`);
      continue;
    }
    await client.query('UPDATE sites SET cover_media_id = NULL, panorama_media_id = NULL WHERE id = $1', [siteId]);
    await client.query('DELETE FROM media WHERE owner_entity_type = $1 AND owner_entity_id = $2', ['sites', siteId]);
  }
}

async function processTask(
  client: PoolClient,
  villageId: string,
  task: PhotoTask,
  indexBySite: Map<string, number>,
): Promise<'inserted' | 'skipped-no-site' | 'skipped-download' | 'error'> {
  const fileId = driveFileId(task.driveUrl);
  if (!fileId) return 'skipped-download';

  const siteId = await resolveSiteId(client, villageId, task.siteName);
  if (!siteId) return 'skipped-no-site';

  const slug = slugifyVietnamese(task.siteName) || 'anh';
  const nextIndex = (indexBySite.get(siteId) ?? 0) + 1;
  indexBySite.set(siteId, nextIndex);

  try {
    const downloaded = await downloadDriveFile(fileId);
    if (!downloaded) {
      console.warn(`  [bỏ qua] không tải được ${task.driveUrl} (${task.siteName})`);
      return 'skipped-download';
    }

    // Geometry, not the workbook label, decides 360°: see isEquirectangular()
    // in lib/drivePhoto.ts. Surveyors' "360" labels produced both false
    // positives and misses across these workbooks (migrations/014), so the
    // real pixels win — a disagreement is logged as a data-entry warning.
    const isPanorama = isEquirectangular(downloaded);
    if (task.isPanorama !== isPanorama) {
      console.warn(
        `  [nhãn lệch] ${task.siteName}: workbook ghi "${task.isPanorama ? '360' : 'ảnh thường'}" nhưng ảnh thật là "${isPanorama ? '360 (2:1)' : 'ảnh thường'}" — lấy theo ảnh thật.`,
      );
    }
    const kind = isPanorama ? 'panorama' : downloaded.kind;
    const fileName = `${slug}-${nextIndex}.${downloaded.extension}`;
    const relativeUrl = `/uoc-le/sites/${fileName}`;
    const absolutePath = path.join(PUBLIC_DIR, 'sites', fileName);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, downloaded.buffer);

    if (!DRY_RUN) {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO media (url, kind, caption, owner_entity_type, owner_entity_id)
         VALUES ($1, $2, $3, 'sites', $4) RETURNING id`,
        [relativeUrl, kind, task.caption, siteId],
      );

      if (kind === 'anh') {
        await client.query('UPDATE sites SET cover_media_id = $1 WHERE id = $2 AND cover_media_id IS NULL', [
          inserted.rows[0].id,
          siteId,
        ]);
      } else if (kind === 'panorama') {
        await client.query('UPDATE sites SET panorama_media_id = $1 WHERE id = $2 AND panorama_media_id IS NULL', [
          inserted.rows[0].id,
          siteId,
        ]);
      }
    }

    console.log(
      `  [ok] ${task.siteName} -> ${relativeUrl} (${kind})${task.caption ? ` ("${task.caption}")` : ''}`,
    );
    return 'inserted';
  } catch (error) {
    console.error(`  [lỗi] ${task.driveUrl} (${task.siteName}):`, error instanceof Error ? error.message : error);
    return 'error';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log(`Đọc workbook: ${XLSX_PATH}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(XLSX_PATH);

  const client = await pool.connect();
  const warnings: string[] = [];
  const tasks: PhotoTask[] = [];

  try {
    const villageResult = await client.query<{ id: string }>('SELECT id FROM villages WHERE name = $1', [
      VILLAGE_NAME,
    ]);
    const villageId = villageResult.rows[0]?.id;
    if (!villageId) throw new Error(`Không tìm thấy làng "${VILLAGE_NAME}" trong CSDL.`);

    await clearExistingMedia(client, villageId, warnings);

    for (const worksheet of workbook.worksheets) {
      const name = worksheet.name.trim();
      if (name === SHEET2_NAME.trim()) {
        tasks.push(...collectSheet2Tasks(worksheet, warnings));
      } else if (name === '4.1. Kiến trúc đình Ước lễ') {
        tasks.push(...collectArchitectureSheetTasks(worksheet, 'Đình làng Ước Lễ', warnings));
      } else if (name === '4.1.1.Hiện vật-Mỹ thuật của Đìn') {
        tasks.push(...collectHienVatSheetTasks(worksheet, 'Đình làng Ước Lễ', warnings));
      } else if (name === '4.2. Kiến trúc Chùa Sổ') {
        tasks.push(...collectArchitectureSheetTasks(worksheet, 'Chùa Sùng Phúc', warnings));
      } else if (name === '4.2.1 Hiện vật-Mỹ thuật chùa Sổ') {
        tasks.push(...collectHienVatSheetTasks(worksheet, 'Chùa Sùng Phúc', warnings));
      } else if (name === '6. Di sản văn hóa phi vật thể') {
        tasks.push(...collectIntangibleHeritageTasks(worksheet, warnings));
      }
      // "4.3"/"4.3.1"/"4.4"/"4.4.1" (nhà cụ Khả, nhà bà Bào) have no matching
      // `sites` row (see header note), so they're absent from this `sites`-
      // owner pass — the second pass below (heritage_buildings) covers all
      // four buildings, including these two.
    }

    console.log(`\nTổng số ảnh cần xử lý: ${tasks.length}${Number.isFinite(LIMIT) ? ` (giới hạn ${LIMIT})` : ''}`);
    if (DRY_RUN) console.log('(chế độ --dry-run: chỉ tải file, không ghi CSDL)');

    const counts = { inserted: 0, 'skipped-no-site': 0, 'skipped-download': 0, error: 0 };
    const indexBySite = new Map<string, number>();
    for (const task of tasks.slice(0, LIMIT)) {
      const outcome = await processTask(client, villageId, task, indexBySite);
      counts[outcome]++;
      await sleep(150);
    }

    console.log('\n--- Kết quả ---');
    console.log(counts);

    // Second pass: sheets 4.1–4.4 attached directly to heritage_buildings
    // (see collectBuildingPhotoTasks header note) — all 4 buildings had zero
    // photos there before this.
    const buildingSheetRe = /^4\.\d\. /;
    const buildingTasks: BuildingPhotoTask[] = [];
    for (const worksheet of workbook.worksheets) {
      if (!buildingSheetRe.test(worksheet.name.trim())) continue;
      buildingTasks.push(...(await collectBuildingPhotoTasks(client, villageId, worksheet, warnings)));
    }

    console.log(`\nTổng số ảnh công trình (heritage_buildings) cần xử lý: ${buildingTasks.length}`);
    const buildingCounts = { inserted: 0, 'skipped-exists': 0, 'skipped-download': 0, error: 0 };
    const indexByBuilding = new Map<string, number>();
    for (const task of buildingTasks) {
      const outcome = await processBuildingPhotoTask(client, task, indexByBuilding);
      buildingCounts[outcome]++;
      await sleep(150);
    }

    console.log('\n--- Kết quả (heritage_buildings) ---');
    console.log(buildingCounts);

    if (warnings.length > 0) {
      console.log('\n--- Cảnh báo ---');
      for (const warning of warnings) console.log(` - ${warning}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
