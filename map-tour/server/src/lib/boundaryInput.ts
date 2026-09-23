// Nhận dạng và đọc ranh giới do người dùng DÁN vào ô trong trang quản trị.
//
// Mục đích: người biên tập lấy toạ độ từ bất cứ công cụ nào cũng dán được, mà
// không phải tự đổi định dạng. Ba dạng được nhận, phân biệt bằng ký tự đầu:
//
//   '{'  -> GeoJSON Polygon / Feature / FeatureCollection 1 feature   [lng,lat]
//   '['  -> định dạng của app, để giá trị prefill round-trip được     [lat,lng]
//   khác -> khối <coordinates> dán thẳng từ file KML                  [lng,lat]
//
// Hai trong ba dạng là [lng,lat] và dạng còn lại là [lat,lng]; đảo sai thứ tự
// đặt cả làng sang châu lục khác. Vì thế hàm này CHỈ đọc và đổi trục, rồi
// chuyển sang validateRing() (boundaryValidate.ts) để kiểm hộp bao làng — nơi
// một vụ đảo trục bị bắt. Không tự kiểm định gì ở đây.

import type { LatLng } from './geo.js';

export type BoundaryInputFormat = 'geojson' | 'app' | 'kml-coordinates';

export interface ParsedBoundaryInput {
  ring: LatLng[];
  format: BoundaryInputFormat;
  errors: string[];
}

const EMPTY_MESSAGE = 'Chưa dán toạ độ ranh giới.';

function fail(format: BoundaryInputFormat, message: string): ParsedBoundaryInput {
  return { ring: [], format, errors: [message] };
}

/** Đổi một danh sách [lng,lat,(alt)] của GeoJSON/KML sang [lat,lng] của app. */
function fromLngLat(pairs: unknown[], format: BoundaryInputFormat): ParsedBoundaryInput {
  const ring: LatLng[] = [];
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length < 2) {
      return fail(format, 'Có đỉnh không đúng dạng [kinh độ, vĩ độ].');
    }
    const lng = Number(pair[0]);
    const lat = Number(pair[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return fail(format, 'Có đỉnh chứa giá trị không phải số.');
    }
    ring.push([lat, lng]);
  }
  return { ring, format, errors: [] };
}

function parseGeoJson(text: string): ParsedBoundaryInput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail('geojson', 'Không đọc được JSON. Kiểm tra lại đã dán đủ và đúng dấu ngoặc chưa.');
  }

  // Bóc dần FeatureCollection -> Feature -> geometry, rồi mới xét type.
  let node = parsed as Record<string, unknown> | null;
  if (node && node.type === 'FeatureCollection') {
    const features = node.features;
    if (!Array.isArray(features) || features.length === 0) {
      return fail('geojson', 'FeatureCollection không có feature nào.');
    }
    if (features.length > 1) {
      return fail(
        'geojson',
        `FeatureCollection có ${features.length} feature; chỉ dán một hình ranh giới cho mỗi địa danh.`,
      );
    }
    node = features[0] as Record<string, unknown>;
  }
  if (node && node.type === 'Feature') {
    node = node.geometry as Record<string, unknown> | null;
  }
  if (!node || typeof node !== 'object') {
    return fail('geojson', 'Không tìm thấy hình học trong GeoJSON đã dán.');
  }
  // {} là object nên qua được guard trên; không chặn ở đây thì thông báo bên
  // dưới sẽ lộ chữ "undefined" ra cho người biên tập đọc.
  if (typeof node.type !== 'string') {
    return fail('geojson', 'Không tìm thấy hình học trong GeoJSON đã dán (thiếu trường "type").');
  }

  if (node.type === 'MultiPolygon') {
    return fail(
      'geojson',
      'Đây là MultiPolygon (hình nhiều mảnh rời). Định dạng lưu hiện tại chỉ nhận một vòng duy nhất — ' +
        'tách thành từng địa danh riêng, hoặc vẽ lại thành một hình liền.',
    );
  }
  if (node.type !== 'Polygon') {
    return fail('geojson', `Hình học dạng "${String(node.type)}" không dùng làm ranh giới được; cần Polygon.`);
  }

  const coordinates = node.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return fail('geojson', 'Polygon không có toạ độ.');
  }
  if (coordinates.length > 1) {
    return fail(
      'geojson',
      `Polygon có ${coordinates.length} vòng (vòng ngoài + lỗ bên trong). ` +
        'Định dạng lưu hiện tại chỉ nhận một vòng duy nhất, không biểu diễn được lỗ.',
    );
  }
  if (!Array.isArray(coordinates[0])) {
    return fail('geojson', 'Vòng toạ độ của Polygon không đúng dạng.');
  }
  return fromLngLat(coordinates[0] as unknown[], 'geojson');
}

function parseAppFormat(text: string): ParsedBoundaryInput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail('app', 'Không đọc được JSON. Kiểm tra lại đã dán đủ và đúng dấu ngoặc chưa.');
  }
  if (!Array.isArray(parsed)) {
    return fail('app', 'Cần một mảng các đỉnh [[vĩ độ, kinh độ], ...].');
  }
  const ring: LatLng[] = [];
  for (const pair of parsed) {
    if (!Array.isArray(pair) || pair.length < 2) {
      return fail('app', 'Có đỉnh không đúng dạng [vĩ độ, kinh độ].');
    }
    const lat = Number(pair[0]);
    const lng = Number(pair[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return fail('app', 'Có đỉnh chứa giá trị không phải số.');
    }
    ring.push([lat, lng]);
  }
  return { ring, format: 'app', errors: [] };
}

function parseKmlCoordinates(text: string): ParsedBoundaryInput {
  // Bản xuất thật của My Maps tách các tuple bằng newline + tab + thụt lề, nên
  // tách theo mọi khoảng trắng chứ không riêng dấu cách.
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return fail('kml-coordinates', EMPTY_MESSAGE);

  const pairs: number[][] = [];
  for (const token of tokens) {
    const parts = token.split(',');
    if (parts.length < 2) {
      return fail(
        'kml-coordinates',
        `Không nhận ra định dạng đã dán ("${token.slice(0, 24)}"). ` +
          'Cần một trong ba dạng: GeoJSON (bắt đầu bằng {), mảng [[vĩ độ, kinh độ], ...], ' +
          'hoặc khối <coordinates> của KML dạng "kinh độ,vĩ độ" cách nhau bởi khoảng trắng.',
      );
    }
    // Bỏ thành phần thứ ba (độ cao) nếu có.
    pairs.push([Number(parts[0]), Number(parts[1])]);
  }
  return fromLngLat(pairs, 'kml-coordinates');
}

/**
 * Đọc ô dán và trả vòng theo [lat,lng]. KHÔNG kiểm định hình học — việc đó
 * thuộc validateRing(). Không throw.
 */
export function parseBoundaryInput(raw: string): ParsedBoundaryInput {
  const text = raw.trim();
  if (text.length === 0) return fail('app', EMPTY_MESSAGE);
  if (text.startsWith('{')) return parseGeoJson(text);
  if (text.startsWith('[')) return parseAppFormat(text);
  return parseKmlCoordinates(text);
}

/**
 * Kết xuất về đúng định dạng lưu của app, để prefill vào ô dán. Cặp
 * parseBoundaryInput(formatBoundaryInput(ring)) phải trả lại chính ring đó.
 */
export function formatBoundaryInput(ring: LatLng[]): string {
  return `[${ring.map(([lat, lng]) => `[${lat}, ${lng}]`).join(', ')}]`;
}
