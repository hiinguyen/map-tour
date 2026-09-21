// Shared logic for the per-village Google Drive photo-import scripts
// (extracted from the original one-off import-cu-da-photos.ts so it isn't
// copy-pasted 4 more times for Hạ Thái/Làng Cựu/Làng Chuông/Phú Vinh). Each
// village still gets its own thin driver script supplying a VillagePhotoConfig
// (file paths, sheet-2 column layout, craft-sheet -> product-name mapping)
// because those genuinely differ per source workbook — see importParse.ts's
// own per-file overrides for the same reason.
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { PoolClient, Pool } from 'pg';
import { extractLabeledRows, valueByLastSegment } from '../../src/lib/excelExtract.js';
import { slugifyVietnamese } from '../../src/lib/slugify.js';
import { driveFileId, downloadDriveFile, isEquirectangular } from './drivePhoto.js';

export type OwnerType = 'villages' | 'sites' | 'heritage_buildings' | 'decorative_art_items' | 'craft_products';

export interface PhotoTask {
  ownerType: OwnerType;
  ownerId: string;
  ownerLabel: string;
  driveUrl: string;
  caption: string | null;
  setCoverIfUnset: boolean;
  isPanorama: boolean;
}

// Same naming quirks as importParse.ts (see its BUILDING_SHEET/DECORATIVE_SUB_SHEET
// comments): optional trailing "." before the space (Phú Vinh), and a letter
// or number as the sub-sheet's second segment (Lang Cuu/Làng Chuông "4.N.a").
export const BUILDING_SHEET_RE = /^4\.(\d+)\.?\s/;
export const DECORATIVE_SUB_RE = /^4\.(\d+)\.([0-9]+|[a-zA-Z])/;
export const FIVE_DOT_SHEET_RE = /^5\.(\d+)/;

export interface SheetRoleOverride {
  role: 'building' | 'decorative';
  buildingTempId?: string; // only for role: 'decorative'
}

export interface VillagePhotoConfig {
  villageName: string; // matches villages.name exactly (DB lookup)
  xlsxPath: string;
  publicDir: string;
  publicUrlPrefix: string; // e.g. "/ha-thai"
  sourceFileName: string; // matches importParse.ts's SHEET_ROLE_OVERRIDES key, e.g. "Hạ Thái.xlsx"
  sheetRoleOverrides?: Record<string, SheetRoleOverride>;
  // Mirrors importParse.ts's FORCED_HEADER: some building sheets have no
  // discoverable "Dữ liệu"/"Nội dung" header (or duplicate it in both the
  // label and data columns) — only needed for resolving the building's own
  // "Tên" field here, since collectBuildingTasks reads photo cells by fixed
  // column position regardless of header.
  forcedHeader?: Record<string, { headerRow: number; dataCol: number }>;
  sheet2: {
    sheetName: string;
    categoryCol: number;
    nameCols: number[]; // last non-empty wins, resets deeper cols on a shallower-col change (see collectSheet2Tasks)
    fieldTypeCol: number;
    dataCol: number;
    // The site name stored in `sites.name` may differ from the sheet-2 raw
    // label (whitespace/newline cleanup applied when the GPS migration was
    // authored) — this must produce the SAME final string to resolve the
    // right site by name.
    cleanName: (raw: string) => string;
  };
  craftSheets: Array<{ sheetName: string; productName: string }>;
}

// Must match the exact transform used when the GPS-site migration SQL was
// generated (scripts/_gen_sites_migration.mjs, now deleted) so this resolves
// the same `sites.name` value.
export function cleanSiteName(raw: string): string {
  return raw
    .replace(/\s*\n\s*_\s*\n\s*/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cellPlainText(cell: ExcelJS.Cell): string {
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

export function cellDriveUrl(cell: ExcelJS.Cell): string | null {
  const raw = cell.value as unknown;
  if (raw && typeof raw === 'object' && 'hyperlink' in raw) {
    const hyperlink = (raw as { hyperlink?: string }).hyperlink;
    if (hyperlink && /drive\.google\.com\/file\/d\//.test(hyperlink)) return hyperlink;
  }
  return null;
}

function isPanoramaLabel(...labels: string[]): boolean {
  return labels.some((label) => /360/.test(label));
}

const TRIVIAL_CAPTION_WORDS = new Set(['ảnh', 'anh', 'vị trí', 'vi tri', '-']);

export function meaningfulCaption(...candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    const text = candidate?.trim();
    if (text && !TRIVIAL_CAPTION_WORDS.has(text.toLowerCase())) return text;
  }
  return null;
}

const DECORATIVE_META_SUBJECTS = new Set(['sở hữu']);

async function resolveVillageId(client: PoolClient, name: string): Promise<string | null> {
  // migrations/022_fix_spelling_and_capitalization.sql prefixed every village
  // name with "Làng " after these VillagePhotoConfig.villageName values were
  // written (some still lack it, or differ only in casing) — try both forms.
  const result = await client.query<{ id: string }>(
    'SELECT id FROM villages WHERE lower(name) = lower($1) OR lower(name) = lower($2)',
    [name, `Làng ${name}`],
  );
  return result.rows[0]?.id ?? null;
}
async function resolveSiteId(client: PoolClient, villageId: string, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>('SELECT id FROM sites WHERE village_id = $1 AND name = $2', [
    villageId,
    name,
  ]);
  return result.rows[0]?.id ?? null;
}
async function resolveBuildingId(client: PoolClient, villageId: string, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    'SELECT id FROM heritage_buildings WHERE village_id = $1 AND lower(name) = lower($2)',
    [villageId, name],
  );
  return result.rows[0]?.id ?? null;
}
async function resolveCraftProductId(client: PoolClient, villageId: string, name: string): Promise<string | null> {
  const result = await client.query<{ id: string }>('SELECT id FROM craft_products WHERE village_id = $1 AND name = $2', [
    villageId,
    name,
  ]);
  return result.rows[0]?.id ?? null;
}
async function resolveDecorativeItemId(client: PoolClient, buildingId: string, subjectName: string): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    'SELECT id FROM decorative_art_items WHERE building_id = $1 AND subject_name = $2',
    [buildingId, subjectName],
  );
  return result.rows[0]?.id ?? null;
}

async function mediaAlreadyExists(client: PoolClient, ownerType: OwnerType, ownerId: string, url: string): Promise<boolean> {
  const result = await client.query('SELECT 1 FROM media WHERE owner_entity_type = $1 AND owner_entity_id = $2 AND url = $3', [
    ownerType,
    ownerId,
    url,
  ]);
  return (result.rowCount ?? 0) > 0;
}

const FOLDER_BY_OWNER_TYPE: Record<OwnerType, string> = {
  villages: 'villages',
  sites: 'sites',
  heritage_buildings: 'heritage-buildings',
  decorative_art_items: 'decorative',
  craft_products: 'craft-products',
};

// --- Sheet-2 (map POI photos) -----------------------------------------------
// Groups rows the same way scripts/_extract_sheet2.mjs (used to author the
// GPS-site migration) did: a new "Vị trí" row starts a new object, later
// "Ảnh" rows under it are photos for that same site.
async function collectSheet2Tasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  villageId: string,
  config: VillagePhotoConfig,
  warnings: string[],
): Promise<PhotoTask[]> {
  const { nameCols, fieldTypeCol, dataCol, cleanName } = config.sheet2;
  const nameCarry = nameCols.map(() => '');
  let currentName = '';
  const tasks: PhotoTask[] = [];
  let currentSiteId: string | null = null;
  let currentSiteName = '';
  const seenFileIds = new Set<string>();

  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const c3 = cellPlainText(row.getCell(fieldTypeCol)).toLowerCase();
    for (let i = 0; i < nameCols.length; i++) {
      const value = cellPlainText(row.getCell(nameCols[i]));
      if (value && value !== nameCarry[i]) {
        nameCarry[i] = value;
        for (let j = i + 1; j < nameCarry.length; j++) nameCarry[j] = '';
      }
    }
    currentName = [...nameCarry].reverse().find((v) => v) ?? currentName;

    if (c3.startsWith('vị trí')) {
      currentSiteName = cleanName(currentName);
      currentSiteId = await resolveSiteId(client, villageId, currentSiteName);
      if (!currentSiteId) {
        warnings.push(`Sheet "2.": không tìm thấy site "${currentSiteName}" trong CSDL, bỏ qua ảnh liên quan.`);
      }
      continue;
    }
    if (!currentSiteId || !c3.startsWith('ảnh')) continue;
    const dataCell = row.getCell(dataCol);
    const driveUrl = cellDriveUrl(dataCell);
    if (!driveUrl) continue;
    const fileId = driveFileId(driveUrl);
    const dedupeKey = `${currentSiteId}|${fileId}`;
    if (!fileId || seenFileIds.has(dedupeKey)) continue;
    seenFileIds.add(dedupeKey);
    tasks.push({
      ownerType: 'sites',
      ownerId: currentSiteId,
      ownerLabel: currentSiteName,
      driveUrl,
      caption: meaningfulCaption(cellPlainText(dataCell)),
      setCoverIfUnset: true,
      isPanorama: isPanoramaLabel(cellPlainText(dataCell)),
    });
  }
  return tasks;
}

// --- Heritage building sheets ("4.N. ...") ----------------------------------
async function collectBuildingTasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  villageId: string,
  buildingName: string,
  warnings: string[],
): Promise<PhotoTask[]> {
  const buildingId = await resolveBuildingId(client, villageId, buildingName);
  if (!buildingId) {
    warnings.push(`Sheet "${worksheet.name}": không tìm thấy công trình "${buildingName}" trong CSDL, bỏ qua ảnh.`);
    return [];
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
  return tasks;
}

// --- Decorative sub-sheets ("4.N.M"/"4.N.a ...") ----------------------------
async function collectDecorativeTasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  buildingId: string,
  warnings: string[],
): Promise<PhotoTask[]> {
  const tasks: PhotoTask[] = [];
  const seenPerSubject = new Set<string>();
  // Same carry-forward-with-reset as excelExtract.ts's extractLabeledRows:
  // when a shallower label column gets a new value, clear the deeper ones —
  // otherwise a stale col-3 subject from an earlier theme group leaks into
  // rows under a new col-1/col-2 theme that hasn't re-specified col 3 yet.
  const carry = ['', '', ''];
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 3; c++) {
      const text = cellPlainText(row.getCell(c));
      if (text) {
        carry[c - 1] = text;
        for (let clear = c; clear < 3; clear++) carry[clear] = '';
      }
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

// --- Craft product sheets ("7.x") -------------------------------------------
async function collectCraftTasks(
  client: PoolClient,
  worksheet: ExcelJS.Worksheet,
  villageId: string,
  productName: string,
  warnings: string[],
): Promise<PhotoTask[]> {
  const productId = await resolveCraftProductId(client, villageId, productName);
  if (!productId) {
    warnings.push(`Sheet "${worksheet.name}": không tìm thấy sản phẩm "${productName}" trong CSDL, bỏ qua ảnh.`);
    return [];
  }

  const tasks: PhotoTask[] = [];
  const seenFileIds = new Set<string>();
  for (let r = 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 6; c++) {
      const driveUrl = cellDriveUrl(row.getCell(c));
      if (!driveUrl) continue;
      const fileId = driveFileId(driveUrl);
      if (!fileId || seenFileIds.has(fileId)) continue;
      seenFileIds.add(fileId);
      const caption = meaningfulCaption(cellPlainText(row.getCell(c + 1)), cellPlainText(row.getCell(1)));
      tasks.push({
        ownerType: 'craft_products',
        ownerId: productId,
        ownerLabel: productName,
        driveUrl,
        caption,
        setCoverIfUnset: false,
        isPanorama: false,
      });
    }
  }
  return tasks;
}

async function processTask(
  client: PoolClient,
  config: VillagePhotoConfig,
  task: PhotoTask,
  indexByOwner: Map<string, number>,
  dryRun: boolean,
): Promise<'inserted' | 'skipped-exists' | 'skipped-download' | 'error'> {
  const fileId = driveFileId(task.driveUrl);
  if (!fileId) return 'skipped-download';

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
    const relativeUrl = `${config.publicUrlPrefix}/${folder}/${fileName}`;
    const absolutePath = path.join(config.publicDir, folder, fileName);

    if (await mediaAlreadyExists(client, task.ownerType, task.ownerId, relativeUrl)) {
      return 'skipped-exists';
    }

    if (!dryRun) {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, downloaded.buffer);
    }

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

    if (!dryRun) {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO media (url, kind, caption, owner_entity_type, owner_entity_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [relativeUrl, kind, task.caption, task.ownerType, task.ownerId],
      );
      if (task.setCoverIfUnset && kind === 'anh') {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runPhotoImport(pool: Pool, config: VillagePhotoConfig, opts: { dryRun: boolean; limit: number }): Promise<void> {
  console.log(`Đọc workbook: ${config.xlsxPath}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(config.xlsxPath);

  const client = await pool.connect();
  const warnings: string[] = [];
  const tasks: PhotoTask[] = [];

  try {
    const villageId = await resolveVillageId(client, config.villageName);
    if (!villageId) {
      console.error(`Không tìm thấy làng "${config.villageName}" trong CSDL — chạy import văn bản trước.`);
      process.exitCode = 1;
      return;
    }

    const buildingNameByTempId = new Map<string, string>();
    for (const worksheet of workbook.worksheets) {
      const name = worksheet.name.trim();
      const override = config.sheetRoleOverrides?.[name];
      const isOverrideBuilding = override?.role === 'building';
      const match = name.match(BUILDING_SHEET_RE);
      if (!match && !isOverrideBuilding) continue;
      const rows = extractLabeledRows(worksheet, config.forcedHeader?.[name]);
      const buildingName = valueByLastSegment(rows, 'Tên');
      const tempId = isOverrideBuilding ? name : `4.${match![1]}`;
      if (!buildingName) {
        warnings.push(`Sheet "${worksheet.name}": không tìm thấy "Tên" công trình, bỏ qua ảnh của sheet này.`);
        continue;
      }
      buildingNameByTempId.set(tempId, buildingName);
    }

    for (const worksheet of workbook.worksheets) {
      const name = worksheet.name.trim();
      const override = config.sheetRoleOverrides?.[name];

      if (name === config.sheet2.sheetName) {
        tasks.push(...(await collectSheet2Tasks(client, worksheet, villageId, config, warnings)));
        continue;
      }

      if (override?.role === 'decorative' && override.buildingTempId) {
        const buildingName = buildingNameByTempId.get(override.buildingTempId);
        if (buildingName) {
          const buildingId = await resolveBuildingId(client, villageId, buildingName);
          if (buildingId) tasks.push(...(await collectDecorativeTasks(client, worksheet, buildingId, warnings)));
        }
        continue;
      }
      if (override?.role === 'building') {
        const buildingName = buildingNameByTempId.get(name);
        if (buildingName) tasks.push(...(await collectBuildingTasks(client, worksheet, villageId, buildingName, warnings)));
        continue;
      }

      const decorativeMatch = name.match(DECORATIVE_SUB_RE);
      if (decorativeMatch) {
        const buildingTempId = `4.${decorativeMatch[1]}`;
        const buildingName = buildingNameByTempId.get(buildingTempId);
        if (buildingName) {
          const buildingId = await resolveBuildingId(client, villageId, buildingName);
          if (buildingId) tasks.push(...(await collectDecorativeTasks(client, worksheet, buildingId, warnings)));
        }
        continue;
      }

      const buildingMatch = name.match(BUILDING_SHEET_RE);
      if (buildingMatch) {
        const buildingName = buildingNameByTempId.get(`4.${buildingMatch[1]}`);
        if (buildingName) tasks.push(...(await collectBuildingTasks(client, worksheet, villageId, buildingName, warnings)));
        continue;
      }

      const fiveDotMatch = name.match(FIVE_DOT_SHEET_RE);
      if (fiveDotMatch) {
        const buildingName = buildingNameByTempId.get(`4.${fiveDotMatch[1]}`);
        if (buildingName) {
          const buildingId = await resolveBuildingId(client, villageId, buildingName);
          if (buildingId) tasks.push(...(await collectDecorativeTasks(client, worksheet, buildingId, warnings)));
        }
        continue;
      }

      const craftSheet = config.craftSheets.find((entry) => entry.sheetName === name);
      if (craftSheet) tasks.push(...(await collectCraftTasks(client, worksheet, villageId, craftSheet.productName, warnings)));
    }

    console.log(`\nTổng số ảnh cần xử lý: ${tasks.length}${Number.isFinite(opts.limit) ? ` (giới hạn ${opts.limit})` : ''}`);
    if (opts.dryRun) console.log('(chế độ --dry-run: chỉ tải file, không ghi CSDL)');

    const counts = { inserted: 0, 'skipped-exists': 0, 'skipped-download': 0, error: 0 };
    const indexByOwner = new Map<string, number>();
    for (const task of tasks.slice(0, opts.limit)) {
      const outcome = await processTask(client, config, task, indexByOwner, opts.dryRun);
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
  }
}
