import type { Pool } from 'pg';

export type GenericFieldType = 'text' | 'textarea' | 'boolean' | 'select' | 'string[]';

export interface GenericFieldOption {
  value: string;
  label: string;
}

export interface GenericFieldConfig {
  name: string;
  column: string;
  label: string;
  type: GenericFieldType;
  required?: boolean;
  options?: GenericFieldOption[];
}

export interface GenericContextField {
  name: string;
  label: string;
}

export interface GenericEntityMeta {
  key: string;
  label: string;
  fields: GenericFieldConfig[];
  context: GenericContextField[];
}

export interface GenericRow {
  id: string;
  title: string;
  subtitle: string | null;
  fields: Record<string, string | boolean | string[] | null>;
  context: Record<string, string | null>;
}

type GenericEntityKey =
  | 'history_stories'
  | 'decorative_art_items'
  | 'intangible_heritage_items'
  | 'craft_products'
  | 'craft_products_internal'
  | 'media';

interface EntityContextDef {
  name: string;
  label: string;
  selectExpr: string;
}

interface EntityDefinition {
  key: GenericEntityKey;
  label: string;
  table: string;
  fromClause: string;
  idExpr: string;
  titleExpr: string;
  subtitleExpr: string;
  searchExpr: string;
  fields: GenericFieldConfig[];
  context: EntityContextDef[];
}

function field(
  name: string,
  column: string,
  label: string,
  type: GenericFieldType,
  opts: { required?: boolean; options?: GenericFieldOption[] } = {},
): GenericFieldConfig {
  return { name, column, label, type, required: opts.required, options: opts.options };
}

function contextField(name: string, label: string, selectExpr: string): EntityContextDef {
  return { name, label, selectExpr };
}

const HISTORY_STORIES_DEF: EntityDefinition = {
  key: 'history_stories',
  label: 'Lịch sử / Sự kiện / Phong tục / Truyền thuyết',
  table: 'history_stories',
  fromClause: 'history_stories t JOIN villages v ON v.id = t.village_id LEFT JOIN sites s ON s.id = t.site_id',
  idExpr: 't.id',
  titleExpr: 't.title',
  subtitleExpr: 'v.name',
  searchExpr: 't.title ILIKE $1',
  fields: [
    field('type', 'type', 'Loại', 'select', {
      required: true,
      options: [
        { value: 'lich_su', label: 'Lịch sử' },
        { value: 'su_kien', label: 'Sự kiện' },
        { value: 'phong_tuc', label: 'Phong tục' },
        { value: 'truyen_thuyet', label: 'Truyền thuyết' },
      ],
    }),
    field('title', 'title', 'Tiêu đề', 'text', { required: true }),
    field('bodyText', 'body_text', 'Nội dung', 'textarea'),
  ],
  context: [
    contextField('villageName', 'Làng', 'v.name'),
    contextField('siteName', 'Điểm liên quan', 's.name'),
  ],
};

const DECORATIVE_ART_ITEMS_DEF: EntityDefinition = {
  key: 'decorative_art_items',
  label: 'Đề tài mỹ thuật trang trí & hiện vật cổ',
  table: 'decorative_art_items',
  fromClause: 'decorative_art_items t JOIN heritage_buildings hb ON hb.id = t.building_id',
  idExpr: 't.id',
  titleExpr: 't.subject_name',
  subtitleExpr: 'hb.name',
  searchExpr: 't.subject_name ILIKE $1',
  fields: [
    field('themeGroup', 'theme_group', 'Nhóm chủ đề', 'select', {
      required: true,
      options: [
        { value: 'tin_nguong_ton_giao', label: 'Tín ngưỡng tôn giáo' },
        { value: 'doi_song_sinh_hoat', label: 'Đời sống sinh hoạt' },
        { value: 'phong_thuy_cat_tuong', label: 'Phong thủy cát tường' },
        { value: 'hien_vat_co', label: 'Hiện vật cổ' },
      ],
    }),
    field('subjectName', 'subject_name', 'Tên đề tài/hiện vật', 'text', { required: true }),
    field('eraEstimate', 'era_estimate', 'Niên đại ước tính', 'text'),
    field('description', 'description', 'Mô tả', 'textarea'),
  ],
  context: [contextField('buildingName', 'Công trình', 'hb.name')],
};

const INTANGIBLE_HERITAGE_ITEMS_DEF: EntityDefinition = {
  key: 'intangible_heritage_items',
  label: 'Di sản văn hoá phi vật thể',
  table: 'intangible_heritage_items',
  fromClause: 'intangible_heritage_items t JOIN villages v ON v.id = t.village_id',
  idExpr: 't.id',
  titleExpr: 't.name',
  subtitleExpr: 'v.name',
  searchExpr: 't.name ILIKE $1',
  fields: [
    field('name', 'name', 'Tên di sản', 'text', { required: true }),
    field('recognitionLevel', 'recognition_level', 'Cấp công nhận', 'select', {
      options: [
        { value: 'unesco', label: 'UNESCO' },
        { value: 'quoc_gia', label: 'Quốc gia' },
        { value: 'tinh', label: 'Tỉnh' },
      ],
    }),
    field('uniquenessDescription', 'uniqueness_description', 'Nét độc đáo', 'textarea'),
    field('participationScope', 'participation_scope', 'Phạm vi tham gia', 'select', {
      options: [
        { value: 'mot_nhom_hoi', label: 'Một nhóm/hội' },
        { value: 'nhieu_nhom_hoi', label: 'Nhiều nhóm/hội' },
        { value: 'toan_the_cong_dong', label: 'Toàn thể cộng đồng' },
      ],
    }),
    field('generationsTransmitted', 'generations_transmitted', 'Số thế hệ truyền lại', 'text'),
    field('touristExperienceLevel', 'tourist_experience_level', 'Mức độ trải nghiệm cho khách', 'select', {
      options: [
        { value: 'chi_xem', label: 'Chỉ xem' },
        { value: 'trai_nghiem_mot_phan', label: 'Trải nghiệm một phần' },
        { value: 'trai_nghiem_toan_bo', label: 'Trải nghiệm toàn bộ' },
      ],
    }),
    field('eventTiming', 'event_timing', 'Thời điểm diễn ra', 'text'),
    field('capacityNote', 'capacity_note', 'Ghi chú sức chứa', 'textarea'),
  ],
  context: [contextField('villageName', 'Làng', 'v.name')],
};

const CRAFT_PRODUCTS_DEF: EntityDefinition = {
  key: 'craft_products',
  label: 'Sản phẩm nghề truyền thống',
  table: 'craft_products',
  fromClause: 'craft_products t JOIN villages v ON v.id = t.village_id',
  idExpr: 't.id',
  titleExpr: 't.name',
  subtitleExpr: 'v.name',
  searchExpr: 't.name ILIKE $1',
  fields: [
    field('name', 'name', 'Tên sản phẩm', 'text', { required: true }),
    field('productGroup', 'product_group', 'Nhóm sản phẩm', 'text'),
    field('startPeriod', 'start_period', 'Thời điểm bắt đầu', 'text'),
    field('isTraditional', 'is_traditional', 'Sản phẩm truyền thống', 'boolean'),
    field('culturalLinkLevel', 'cultural_link_level', 'Mức độ gắn kết văn hoá', 'text'),
    field('materials', 'materials', 'Nguyên liệu', 'textarea'),
    field('productStory', 'product_story', 'Câu chuyện sản phẩm', 'textarea'),
    field('processDescription', 'process_description', 'Mô tả quy trình', 'textarea'),
    field('giftSuitability', 'gift_suitability', 'Phù hợp làm quà', 'text'),
    field('hasExperienceActivity', 'has_experience_activity', 'Có hoạt động trải nghiệm', 'boolean'),
    field('experienceDuration', 'experience_duration', 'Thời lượng trải nghiệm', 'text'),
    field('hasDemoSpace', 'has_demo_space', 'Có không gian trình diễn', 'boolean'),
    field('hasDisplayArea', 'has_display_area', 'Có khu trưng bày', 'boolean'),
    field('hasGuideStaff', 'has_guide_staff', 'Có nhân viên hướng dẫn', 'boolean'),
    field('salesChannels', 'sales_channels', 'Kênh bán hàng', 'string[]'),
    field('mainMarket', 'main_market', 'Thị trường chính', 'text'),
  ],
  context: [contextField('villageName', 'Làng', 'v.name')],
};

const CRAFT_PRODUCTS_INTERNAL_DEF: EntityDefinition = {
  key: 'craft_products_internal',
  label: 'Số liệu kinh doanh sản phẩm nghề (nội bộ)',
  table: 'craft_products_internal',
  fromClause: 'craft_products_internal t JOIN craft_products cp ON cp.id = t.product_id',
  idExpr: 't.id',
  titleExpr: 'cp.name',
  subtitleExpr: 'NULL',
  searchExpr: 'cp.name ILIKE $1',
  fields: [
    field('averageOutputPerYear', 'average_output_per_year', 'Sản lượng trung bình/năm', 'text'),
    field('averageRevenuePerYear', 'average_revenue_per_year', 'Doanh thu trung bình/năm', 'text'),
    field('currentDifficulties', 'current_difficulties', 'Khó khăn hiện tại', 'textarea'),
    field('supportNeeds', 'support_needs', 'Nhu cầu hỗ trợ', 'textarea'),
  ],
  context: [contextField('productName', 'Sản phẩm', 'cp.name')],
};

const MEDIA_DEF: EntityDefinition = {
  key: 'media',
  label: 'Thư viện media (ảnh / panorama / video)',
  table: 'media',
  fromClause: 'media t',
  idExpr: 't.id',
  titleExpr: "COALESCE(NULLIF(t.caption, ''), t.url)",
  subtitleExpr: "t.kind || ' · ' || t.owner_entity_type",
  searchExpr: '(t.caption ILIKE $1 OR t.url ILIKE $1)',
  fields: [
    field('url', 'url', 'Đường dẫn (URL)', 'text', { required: true }),
    field('caption', 'caption', 'Chú thích', 'text'),
    field('attribution', 'attribution', 'Nguồn/Tác giả', 'text'),
  ],
  context: [
    contextField('kind', 'Loại media', 't.kind'),
    contextField('ownerEntityType', 'Thuộc về (loại)', 't.owner_entity_type'),
  ],
};

const ENTITY_DEFS: EntityDefinition[] = [
  HISTORY_STORIES_DEF,
  DECORATIVE_ART_ITEMS_DEF,
  INTANGIBLE_HERITAGE_ITEMS_DEF,
  CRAFT_PRODUCTS_DEF,
  CRAFT_PRODUCTS_INTERNAL_DEF,
  MEDIA_DEF,
];

const ENTITY_DEFS_BY_KEY = new Map<string, EntityDefinition>(ENTITY_DEFS.map((def) => [def.key, def]));

function buildMeta(def: EntityDefinition): GenericEntityMeta {
  return {
    key: def.key,
    label: def.label,
    fields: def.fields,
    context: def.context.map((c) => ({ name: c.name, label: c.label })),
  };
}

function buildSelectClause(def: EntityDefinition): string {
  const fieldSelects = def.fields.map((f) => `t.${f.column} AS "f_${f.name}"`);
  const contextSelects = def.context.map((c) => `${c.selectExpr} AS "ctx_${c.name}"`);
  return [`${def.idExpr} AS id`, `${def.titleExpr} AS title`, `${def.subtitleExpr} AS subtitle`, ...fieldSelects, ...contextSelects].join(
    ', ',
  );
}

function buildListQuery(def: EntityDefinition, hasSearch: boolean): string {
  const whereClause = hasSearch ? `WHERE ${def.searchExpr}` : '';
  return `SELECT ${buildSelectClause(def)} FROM ${def.fromClause} ${whereClause} ORDER BY t.created_at DESC LIMIT 200`;
}

function buildSingleRowQuery(def: EntityDefinition): string {
  return `SELECT ${buildSelectClause(def)} FROM ${def.fromClause} WHERE ${def.idExpr} = $1`;
}

interface RawGenericRow {
  id: string;
  title: string;
  subtitle: string | null;
  [key: string]: unknown;
}

function mapRow(row: RawGenericRow, def: EntityDefinition): GenericRow {
  const fields: Record<string, string | boolean | string[] | null> = {};
  for (const f of def.fields) {
    fields[f.name] = (row[`f_${f.name}`] as string | boolean | string[] | null | undefined) ?? null;
  }
  const context: Record<string, string | null> = {};
  for (const c of def.context) {
    context[c.name] = (row[`ctx_${c.name}`] as string | null | undefined) ?? null;
  }
  return { id: row.id, title: row.title, subtitle: row.subtitle, fields, context };
}

export function listGenericEntities(): GenericEntityMeta[] {
  return ENTITY_DEFS.map(buildMeta);
}

export async function listGenericRows(pool: Pool, key: string, search: string | null): Promise<GenericRow[] | null> {
  const def = ENTITY_DEFS_BY_KEY.get(key);
  if (!def) return null;
  const hasSearch = typeof search === 'string' && search.trim().length > 0;
  const query = buildListQuery(def, hasSearch);
  const params = hasSearch ? [`%${search}%`] : [];
  const result = await pool.query<RawGenericRow>(query, params);
  return result.rows.map((row) => mapRow(row, def));
}

function cleanNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseTextFieldValue(value: unknown, fieldConfig: GenericFieldConfig): string | null {
  const cleaned = cleanNullableString(value);
  if (fieldConfig.required && !cleaned) {
    throw new Error(`${fieldConfig.label} không được để trống`);
  }
  return cleaned;
}

function parseBooleanFieldValue(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  return null;
}

function parseSelectFieldValue(value: unknown, fieldConfig: GenericFieldConfig): string | null {
  const isEmpty = value === null || value === undefined || value === '';
  if (isEmpty) {
    if (fieldConfig.required) {
      throw new Error(`${fieldConfig.label} không được để trống`);
    }
    return null;
  }
  const isValidOption = typeof value === 'string' && (fieldConfig.options ?? []).some((option) => option.value === value);
  if (!isValidOption) {
    throw new Error(`${fieldConfig.label} không hợp lệ`);
  }
  return value as string;
}

function parseStringArrayFieldValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function parseFieldValue(value: unknown, fieldConfig: GenericFieldConfig): string | boolean | string[] | null {
  switch (fieldConfig.type) {
    case 'text':
    case 'textarea':
      return parseTextFieldValue(value, fieldConfig);
    case 'boolean':
      return parseBooleanFieldValue(value);
    case 'select':
      return parseSelectFieldValue(value, fieldConfig);
    case 'string[]':
      return parseStringArrayFieldValue(value);
    default:
      return null;
  }
}

export async function updateGenericRow(
  pool: Pool,
  key: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<GenericRow | null> {
  const def = ENTITY_DEFS_BY_KEY.get(key);
  if (!def) return null;

  const setClauses: string[] = [];
  const params: unknown[] = [id];
  for (const fieldConfig of def.fields) {
    if (!(fieldConfig.name in fields)) continue;
    const parsedValue = parseFieldValue(fields[fieldConfig.name], fieldConfig);
    params.push(parsedValue);
    setClauses.push(`${fieldConfig.column} = $${params.length}`);
  }

  if (setClauses.length > 0) {
    await pool.query(`UPDATE ${def.table} SET ${setClauses.join(', ')} WHERE id = $1`, params);
  }

  const result = await pool.query<RawGenericRow>(buildSingleRowQuery(def), [id]);
  const row = result.rows[0];
  if (!row) return null;
  return mapRow(row, def);
}

export interface MediaRowInput {
  url: string;
  caption: string | null;
  attribution: string | null;
}

export async function updateMediaRow(
  pool: Pool,
  id: string,
  input: { url: unknown; caption: unknown; attribution: unknown },
): Promise<{ id: string; url: string; caption: string | null; attribution: string | null } | null> {
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  if (!url) throw new Error('Đường dẫn ảnh không được để trống');
  const result = await pool.query<{ id: string; url: string; caption: string | null; attribution: string | null }>(
    `UPDATE media SET url = $2, caption = $3, attribution = $4 WHERE id = $1
     RETURNING id, url, caption, attribution`,
    [id, url, cleanNullableString(input.caption), cleanNullableString(input.attribution)],
  );
  return result.rows[0] ?? null;
}

export async function deleteMediaRow(pool: Pool, id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM media WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
