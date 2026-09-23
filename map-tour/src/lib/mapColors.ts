// MapLibre paint properties require literal color values, not CSS custom
// properties, so these must be kept in sync by hand with the matching
// tokens in src/index.css (--color-primary, --color-secondary-container,
// --color-tertiary-container, --gold).
export const MAP_COLORS = {
  primary: '#610000',
  primaryContainer: '#8b0000',
  secondaryContainer: '#fcd400',
  tertiaryContainer: '#354910',
  gold: '#c9a227',
  shadowInk: 'rgba(54,15,0,0.18)',
} as const;
