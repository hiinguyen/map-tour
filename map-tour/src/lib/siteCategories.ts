// Per-category marker styling for the map — kept in sync by hand with the
// `category` strings seeded in init/04_seed_sample.sql (sites.category).
// MapLibre markers are plain DOM nodes rather than React components, so
// icons are inline SVG markup instead of JSX.
export interface CategoryStyle {
  color: string;
  icon: string;
}

const ICON_GATE = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-5 9 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 9v11M19 9v11" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M9 20v-6h6v6" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;

const ICON_TEMPLE = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l3 4H9l3-4z" fill="white"/><rect x="10" y="7" width="4" height="2" fill="white"/><path d="M6 20l1-9h10l1 9" stroke="white" stroke-width="2" stroke-linejoin="round"/><path d="M4 20h16" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;

const ICON_DROP = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z" fill="white"/></svg>`;

const ICON_CLUSTER = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20v-7l4-3 4 3v7" stroke="white" stroke-width="2" stroke-linejoin="round"/><path d="M12 20v-9l4-3 4 3v9" stroke="white" stroke-width="2" stroke-linejoin="round"/><path d="M2 20h20" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;

const ICON_CRAFT = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 14a6 6 0 0012 0" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M4 14h16" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M9 4l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="4" r="1.2" fill="white"/></svg>`;

const ICON_HOUSE = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 11l8-7 8 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v10h12V10" stroke="white" stroke-width="2" stroke-linejoin="round"/><rect x="10" y="14" width="4" height="6" fill="white"/></svg>`;

const ICON_PAVILION = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l9-5 9 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 8v3M19 8v3M12 6v14" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M4 20h16" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'Di tích kiến trúc': { color: '#610000', icon: ICON_GATE },
  'Di tích tín ngưỡng': { color: '#b45309', icon: ICON_TEMPLE },
  'Cảnh quan': { color: '#0e7490', icon: ICON_DROP },
  'Quần thể di sản': { color: '#78350f', icon: ICON_CLUSTER },
  'Làng nghề': { color: '#3f6212', icon: ICON_CRAFT },
  'Nhà cổ': { color: '#7c2d12', icon: ICON_HOUSE },
  'Công trình công cộng': { color: '#44403c', icon: ICON_PAVILION },
};

const FALLBACK_STYLE: CategoryStyle = { color: '#610000', icon: ICON_GATE };

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
}

// Known category strings, exposed for admin-form suggestions (e.g. a
// <datalist>). Category itself stays free text — it is not a DB enum — this
// list is just the source of truth for the values styled above.
export const KNOWN_SITE_CATEGORIES: string[] = Object.keys(CATEGORY_STYLES);
