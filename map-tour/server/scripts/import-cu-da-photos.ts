// One-off data-population script for "Làng Cự Đà.xlsx": the workbook has no
// embedded images (its drawing parts are empty template artifacts — see the
// session notes) — every photo is instead a Google Drive share link attached
// as a cell hyperlink. This downloads each linked photo, saves it under
// map-tour/public/cu-da/, and records a `media` row pointing at the already
// text-imported village/site/heritage_building/decorative_art_item/
// craft_product it belongs to (see docs/thiet-ke-csdl.md §4 `media`).
//
// Usage: npx tsx scripts/import-cu-da-photos.ts [--dry-run] [--limit=N]
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
const XLSX_PATH = path.resolve(__dirname, '../../../Cự Đà.xlsx');
const PUBLIC_DIR = path.resolve(__dirname, '../../public/cu-da');
const VILLAGE_NAME = 'Cự Đà';

const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

type OwnerType = 'villages' | 'sites' | 'heritage_buildings' | 'decorative_art_items' | 'craft_products';

interface PhotoTask {
  ownerType: OwnerType;
  ownerId: string;
  ownerLabel: string; // for logging + file naming
  driveUrl: string;
  caption: string | null;
  setCoverIfUnset: boolean;
  isPanorama: boolean;
}

// A photo is 360° only when its OWN label/caption says so ("Ảnh 360", "ảnh
// 360 nhà chính", ...) — checking the row's full instructional text instead
// (column 6 repeats boilerplate survey guidance mentioning "360" on every row
// of the "Ảnh các góc chính"/"Ảnh trong nhà" sections) produces false
// positives on ordinary corner/interior photos that never mention 360.
function isPanoramaLabel(...labels: string[]): boolean {
  return labels.some((label) => /360/.test(label));
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

const TRIVIAL_CAPTION_WORDS = new Set(['ảnh', 'anh', 'vị trí', 'vi tri']);

function meaningfulCaption(...candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    const text = candidate?.trim();
    if (text && !TRIVIAL_CAPTION_WORDS.has(text.toLowerCase())) return text;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sheet "2. Bản đồ tổng thể của làng " — one row per POI photo, matched by row
// number to the site already created by migrations/006 (same grouping/merge
// decisions documented there: "Cổng làng Cự Đà" and "Chùa Cự Đà" each absorb
// a second label that shares the same map pin, so they get 2-3 photos).
const SHEET2_NAME = '2. Bản đồ tổng thể của làng'.trim();
const SHEET2_ENTRIES: Array<{ row: number; ownerType: 'villages' | 'sites'; name: string; caption?: string }> = [
  { row: 4, ownerType: 'villages', name: VILLAGE_NAME, caption: 'Tổng mặt bằng làng Cự Đà' },
  { row: 6, ownerType: 'sites', name: 'Đường chính' },
  { row: 8, ownerType: 'sites', name: 'Đường nhánh/ngõ' },
  { row: 10, ownerType: 'sites', name: 'Đường làng gắn với hoạt động sản xuất (miến)' },
  { row: 13, ownerType: 'sites', name: 'Đình làng Cự Đà' },
  { row: 15, ownerType: 'sites', name: 'Cổng làng Cự Đà' },
  { row: 19, ownerType: 'sites', name: 'Cổng làng Cự Đà' },
  { row: 21, ownerType: 'sites', name: 'Cột cờ' },
  { row: 23, ownerType: 'sites', name: 'Miếu Cự Đà' },
  { row: 26, ownerType: 'sites', name: 'Đàn Xã tắc' },
  { row: 28, ownerType: 'sites', name: 'Chùa Cự Đà' },
  { row: 30, ownerType: 'sites', name: 'Chùa Cự Đà' },
  { row: 34, ownerType: 'sites', name: 'Giếng' },
  { row: 36, ownerType: 'sites', name: 'Chùa Cự Đà' },
  { row: 40, ownerType: 'sites', name: 'Cổng xóm Hiếu Đễ' },
  { row: 42, ownerType: 'sites', name: 'Cổng xóm Quang Trung' },
  { row: 44, ownerType: 'sites', name: 'Cổng xóm - đường làng - nhà cổ' },
  { row: 48, ownerType: 'sites', name: 'Nhà thờ họ' },
  { row: 50, ownerType: 'sites', name: 'Nhà cổ 31' },
  { row: 52, ownerType: 'sites', name: 'Nhà cổ ông Giao' },
  { row: 54, ownerType: 'sites', name: 'Nhà cổ cụ Mão' },
  { row: 56, ownerType: 'sites', name: 'Nhà cổ 216' },
  { row: 58, ownerType: 'sites', name: 'Cây nhãn' },
  { row: 60, ownerType: 'sites', name: 'Cây muỗm' },
  { row: 62, ownerType: 'sites', name: 'Cây Nhãn 2' },
  { row: 64, ownerType: 'sites', name: 'Quán ăn' },
  { row: 66, ownerType: 'sites', name: 'Quán nước' },
];

async function collectSheet2Tasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  warnings: string[],
): Promise<PhotoTask[]> {
  const tasks: PhotoTask[] = [];
  for (const entry of SHEET2_ENTRIES) {
    const cell = worksheet.getRow(entry.row).getCell(4);
    const driveUrl = cellDriveUrl(cell);
    if (!driveUrl) {
      warnings.push(`Sheet "2.": dòng ${entry.row} — không tìm thấy link ảnh cho "${entry.name}".`);
      continue;
    }
    const ownerId =
      entry.ownerType === 'villages'
        ? await resolveVillageId(client, entry.name)
        : await resolveSiteId(client, entry.name);
    if (!ownerId) {
      warnings.push(`Sheet "2.": dòng ${entry.row} — không tìm thấy "${entry.name}" trong CSDL, bỏ qua ảnh.`);
      continue;
    }
    tasks.push({
      ownerType: entry.ownerType,
      ownerId,
      ownerLabel: entry.name,
      driveUrl,
      caption: entry.caption ?? meaningfulCaption(cellPlainText(cell)),
      setCoverIfUnset: entry.ownerType === 'sites',
      isPanorama: false,
    });
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// Heritage building sheets ("4.N. ..."): every photo in the sheet becomes a
// gallery photo for that building — link always sits in column 3, caption
// comes from the column-2 section label (fill-down) plus the cell's own text.
const BUILDING_SHEET_RE = /^4\.(\d+)\.\s/;

async function collectBuildingTasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  warnings: string[],
): Promise<{ tempId: string; buildingName: string; tasks: PhotoTask[] }> {
  const match = worksheet.name.trim().match(BUILDING_SHEET_RE);
  const tempId = `4.${match?.[1] ?? '?'}`;
  const rows = extractLabeledRows(worksheet);
  const buildingName = valueByLastSegment(rows, 'Tên');
  if (!buildingName) {
    warnings.push(`Sheet "${worksheet.name}": không tìm thấy "Tên" công trình, bỏ qua ảnh.`);
    return { tempId, buildingName: '', tasks: [] };
  }
  const buildingId = await resolveBuildingId(client, buildingName);
  if (!buildingId) {
    warnings.push(`Sheet "${worksheet.name}": không tìm thấy công trình "${buildingName}" trong CSDL, bỏ qua ảnh.`);
    return { tempId, buildingName, tasks: [] };
  }

  const tasks: PhotoTask[] = [];
  const seenFileIds = new Set<string>();
  let carryLabel = '';
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const label = cellPlainText(row.getCell(2));
    if (label) carryLabel = label;
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
      ownerType: 'heritage_buildings',
      ownerId: buildingId,
      ownerLabel: buildingName,
      driveUrl,
      caption,
      setCoverIfUnset: false,
      isPanorama: isPanoramaLabel(carryLabel, rawOwnText),
    });
  }
  return { tempId, buildingName, tasks };
}

// ---------------------------------------------------------------------------
// Decorative sub-sheets ("4.N.M ..."): same 3-level (top/subgroup/subject)
// carry-down grouping as importParse's parseDecorativeArtItems, so a photo
// row's own labelPath resolves directly to an already-imported
// decorative_art_items.subject_name for the same building.
const DECORATIVE_SUB_RE = /^4\.(\d+)\.(\d+)/;
const DECORATIVE_META_SUBJECTS = new Set(['sở hữu']);

async function collectDecorativeTasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  buildingNameByTempId: Map<string, string>,
  warnings: string[],
): Promise<PhotoTask[]> {
  const match = worksheet.name.trim().match(DECORATIVE_SUB_RE);
  if (!match) return [];
  const buildingTempId = `4.${match[1]}`;
  const buildingName = buildingNameByTempId.get(buildingTempId);
  if (!buildingName) {
    warnings.push(`Sheet "${worksheet.name}": không xác định được công trình cha (${buildingTempId}), bỏ qua ảnh.`);
    return [];
  }
  const buildingId = await resolveBuildingId(client, buildingName);
  if (!buildingId) {
    warnings.push(`Sheet "${worksheet.name}": không tìm thấy công trình "${buildingName}" trong CSDL, bỏ qua ảnh.`);
    return [];
  }

  const tasks: PhotoTask[] = [];
  const seenPerSubject = new Set<string>();
  const carry = ['', '', ''];
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 3; c++) {
      const text = cellPlainText(row.getCell(c));
      if (text) carry[c - 1] = text;
    }
    const subject = carry[2].trim();
    if (!subject || DECORATIVE_META_SUBJECTS.has(subject.toLowerCase()) || subject.toLowerCase().startsWith('tên (')) {
      continue;
    }
    const dataCell = row.getCell(4);
    const driveUrl = cellDriveUrl(dataCell);
    if (!driveUrl) continue;
    const fileId = driveFileId(driveUrl);
    const dedupeKey = `${subject}|${fileId}`;
    if (!fileId || seenPerSubject.has(dedupeKey)) continue;
    seenPerSubject.add(dedupeKey);

    const itemId = await resolveDecorativeItemId(client, buildingId, subject);
    if (!itemId) {
      warnings.push(`Sheet "${worksheet.name}": không tìm thấy hiện vật "${subject}" trong CSDL, bỏ qua ảnh.`);
      continue;
    }
    tasks.push({
      ownerType: 'decorative_art_items',
      ownerId: itemId,
      ownerLabel: subject,
      driveUrl,
      caption: meaningfulCaption(cellPlainText(dataCell)),
      setCoverIfUnset: false,
      isPanorama: false,
    });
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// Craft product sheets: column 1 carries a broad label, column 2 holds the
// link, column 3 carries a fill-down "Ảnh"/"Video" type tag (only images are
// in scope here), column 4 holds a distinct per-row caption.
const CRAFT_SHEETS: Array<{ sheetName: string; productName: string }> = [
  { sheetName: '7.1. Sản phẩm làm miến', productName: 'Miến' },
  { sheetName: '7.1. Sản phẩm làm tương', productName: 'Tương' },
];

async function collectCraftTasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  productName: string,
  warnings: string[],
): Promise<PhotoTask[]> {
  const productId = await resolveCraftProductId(client, productName);
  if (!productId) {
    warnings.push(`Sheet "${worksheet.name}": không tìm thấy sản phẩm "${productName}" trong CSDL, bỏ qua ảnh.`);
    return [];
  }

  const tasks: PhotoTask[] = [];
  const seenFileIds = new Set<string>();
  let tag = '';
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const tagText = cellPlainText(row.getCell(3));
    if (tagText) tag = tagText;
    if (tag.toLowerCase() !== 'ảnh') continue;
    const dataCell = row.getCell(2);
    const driveUrl = cellDriveUrl(dataCell);
    if (!driveUrl) continue;
    const fileId = driveFileId(driveUrl);
    if (!fileId || seenFileIds.has(fileId)) continue;
    seenFileIds.add(fileId);
    tasks.push({
      ownerType: 'craft_products',
      ownerId: productId,
      ownerLabel: productName,
      driveUrl,
      caption: meaningfulCaption(cellPlainText(row.getCell(4))),
      setCoverIfUnset: false,
      isPanorama: false,
    });
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// DB lookups — matches the natural-name convention used throughout
// importCommit.ts (no id mapping is kept from the earlier text import, so
// entities are re-resolved by name here).
async function resolveVillageId(client: PoolClient, name: string): Promise<string | null> {
  // migrations/022_fix_spelling_and_capitalization.sql prefixed every village
  // name with "Làng " after VILLAGE_NAME above ('Cự Đà') was written — try
  // both forms.
  const result = await client.query<{ id: string }>(
    'SELECT id FROM villages WHERE lower(name) = lower($1) OR lower(name) = lower($2)',
    [name, `Làng ${name}`],
  );
  return result.rows[0]?.id ?? null;
}
async function resolveSiteId(client: PoolClient, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>('SELECT id FROM sites WHERE name = $1', [name]);
  return result.rows[0]?.id ?? null;
}
// Case-insensitive: the source workbook's "Tên" cell for one building
// ("nhà ông Mão") no longer matches the DB's stored casing ("Nhà ông Mão")
// after the workbook was re-exported/replaced — surveyor-entered proper nouns
// aren't reliable enough to require exact casing here.
async function resolveBuildingId(client: PoolClient, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>('SELECT id FROM heritage_buildings WHERE lower(name) = lower($1)', [
    name,
  ]);
  return result.rows[0]?.id ?? null;
}
async function resolveCraftProductId(client: PoolClient, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>('SELECT id FROM craft_products WHERE name = $1', [name]);
  return result.rows[0]?.id ?? null;
}
async function resolveDecorativeItemId(
  client: PoolClient,
  buildingId: string,
  subjectName: string,
): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    'SELECT id FROM decorative_art_items WHERE building_id = $1 AND subject_name = $2',
    [buildingId, subjectName],
  );
  return result.rows[0]?.id ?? null;
}

async function mediaAlreadyExists(
  client: PoolClient,
  ownerType: OwnerType,
  ownerId: string,
  url: string,
): Promise<boolean> {
  const result = await client.query(
    'SELECT 1 FROM media WHERE owner_entity_type = $1 AND owner_entity_id = $2 AND url = $3',
    [ownerType, ownerId, url],
  );
  return (result.rowCount ?? 0) > 0;
}

const FOLDER_BY_OWNER_TYPE: Record<OwnerType, string> = {
  villages: 'villages',
  sites: 'sites',
  heritage_buildings: 'heritage-buildings',
  decorative_art_items: 'decorative',
  craft_products: 'craft-products',
};

async function processTask(
  client: PoolClient,
  task: PhotoTask,
  indexByOwner: Map<string, number>,
): Promise<'inserted' | 'skipped-exists' | 'skipped-download' | 'error'> {
  const fileId = driveFileId(task.driveUrl);
  if (!fileId) return 'skipped-download';

  // Several decorative_art_items share the exact same subject_name across
  // different buildings (e.g. "Đồ tế khí..." exists for both đình and chùa) —
  // the owner-id fragment keeps their filenames from colliding and silently
  // overwriting each other on disk.
  const slug = `${slugifyVietnamese(task.ownerLabel) || 'anh'}-${task.ownerId.slice(0, 8)}`;
  const nextIndex = (indexByOwner.get(`${task.ownerType}:${task.ownerId}`) ?? 0) + 1;
  indexByOwner.set(`${task.ownerType}:${task.ownerId}`, nextIndex);

  try {
    const downloaded = await downloadDriveFile(fileId);
    if (!downloaded) {
      console.warn(`  [bỏ qua] không tải được ${task.driveUrl} (${task.ownerLabel})`);
      return 'skipped-download';
    }

    const folder = FOLDER_BY_OWNER_TYPE[task.ownerType];
    const fileName = `${slug}-${nextIndex}.${downloaded.extension}`;
    const relativeUrl = `/cu-da/${folder}/${fileName}`;
    const absolutePath = path.join(PUBLIC_DIR, folder, fileName);

    if (await mediaAlreadyExists(client, task.ownerType, task.ownerId, relativeUrl)) {
      return 'skipped-exists';
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, downloaded.buffer);

    // Geometry, not the workbook label, decides 360°: see isEquirectangular()
    // in lib/drivePhoto.ts. Surveyors' "360" labels produced both false
    // positives and misses across these workbooks (migrations/014), so the
    // real pixels win — a disagreement is logged as a data-entry warning.
    const isPanorama = isEquirectangular(downloaded);
    if (task.isPanorama !== isPanorama) {
      console.warn(
        `  [nhãn lệch] ${task.ownerLabel}: workbook ghi "${task.isPanorama ? '360' : 'ảnh thường'}" nhưng ảnh thật là "${isPanorama ? '360 (2:1)' : 'ảnh thường'}" — lấy theo ảnh thật.`,
      );
    }
    const kind = isPanorama ? 'panorama' : downloaded.kind;

    if (!DRY_RUN) {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO media (url, kind, caption, owner_entity_type, owner_entity_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [relativeUrl, kind, task.caption, task.ownerType, task.ownerId],
      );

      if (task.setCoverIfUnset) {
        await client.query('UPDATE sites SET cover_media_id = $1 WHERE id = $2 AND cover_media_id IS NULL', [
          inserted.rows[0].id,
          task.ownerId,
        ]);
      }
    }

    console.log(`  [ok] ${task.ownerLabel} -> ${relativeUrl}${task.caption ? ` ("${task.caption}")` : ''}`);
    return 'inserted';
  } catch (error) {
    console.error(`  [lỗi] ${task.driveUrl} (${task.ownerLabel}):`, error instanceof Error ? error.message : error);
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
    // First pass: map building tempId -> name, needed by decorative sub-sheets.
    const buildingNameByTempId = new Map<string, string>();
    for (const worksheet of workbook.worksheets) {
      const match = worksheet.name.trim().match(BUILDING_SHEET_RE);
      if (!match) continue;
      const rows = extractLabeledRows(worksheet);
      const name = valueByLastSegment(rows, 'Tên');
      if (name) buildingNameByTempId.set(`4.${match[1]}`, name);
    }

    for (const worksheet of workbook.worksheets) {
      const name = worksheet.name.trim();
      if (name === SHEET2_NAME) {
        tasks.push(...(await collectSheet2Tasks(client, worksheet, warnings)));
      } else if (BUILDING_SHEET_RE.test(name)) {
        const { tasks: buildingTasks } = await collectBuildingTasks(client, worksheet, warnings);
        tasks.push(...buildingTasks);
      } else if (DECORATIVE_SUB_RE.test(name)) {
        tasks.push(...(await collectDecorativeTasks(client, worksheet, buildingNameByTempId, warnings)));
      } else {
        const craftSheet = CRAFT_SHEETS.find((entry) => entry.sheetName === name);
        if (craftSheet) tasks.push(...(await collectCraftTasks(client, worksheet, craftSheet.productName, warnings)));
      }
    }

    console.log(`\nTổng số ảnh cần xử lý: ${tasks.length}${Number.isFinite(LIMIT) ? ` (giới hạn ${LIMIT})` : ''}`);
    if (DRY_RUN) console.log('(chế độ --dry-run: chỉ tải file, không ghi CSDL)');

    const counts = { inserted: 0, 'skipped-exists': 0, 'skipped-download': 0, error: 0 };
    const indexByOwner = new Map<string, number>();
    for (const task of tasks.slice(0, LIMIT)) {
      const outcome = await processTask(client, task, indexByOwner);
      counts[outcome]++;
      await sleep(150);
    }

    console.log('\n--- Kết quả ---');
    console.log(counts);
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
