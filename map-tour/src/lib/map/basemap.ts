import { addProtocol, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Protocol } from 'pmtiles';
import osmBrightStyle from '../../assets/map/osm-bright-style.json';

// MapLibre v6 loads its module worker as a sibling of the application bundle
// by default. Importing it as a Vite URL makes the worker part of the
// production artifact and gives MapLibre the hashed deploy URL explicitly.
setWorkerUrl(mapLibreWorkerUrl);

// vietnam.pmtiles is built with the OpenMapTiles schema (Planetiler's default
// profile), not the Protomaps schema, so its layers/property names only match
// an OpenMapTiles-schema style like OSM Bright - not @protomaps/basemaps.
export const PMTILES_SOURCE_ID = 'openmaptiles';
export const PMTILES_MAXZOOM = 14;

// PMTiles archives are read through a custom "pmtiles://" URL scheme; the
// protocol only needs to be registered with MapLibre once per page load.
let protocolRegistered = false;
export function ensurePmtilesProtocol(): void {
  if (protocolRegistered) return;
  const protocol = new Protocol();
  addProtocol('pmtiles', protocol.tile);
  protocolRegistered = true;
}

function visibleBasemapLayers(style: StyleSpecification): StyleSpecification['layers'] {
  const layers = style.layers.map((layer) => {
    const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;

    if (layer.type === 'background') {
      return { ...layer, paint: { ...layer.paint, 'background-color': '#f4eadf' } };
    }
    if (layer.type === 'line' && sourceLayer === 'transportation' && layer.id.includes('casing')) {
      return { ...layer, paint: { ...layer.paint, 'line-color': '#9b7664', 'line-opacity': 1 } };
    }
    if (layer.type === 'line' && sourceLayer === 'waterway') {
      return { ...layer, paint: { ...layer.paint, 'line-color': '#5e9faa' } };
    }
    if (layer.type === 'fill' && sourceLayer === 'water') {
      return { ...layer, paint: { ...layer.paint, 'fill-color': '#8fc6cc' } };
    }
    if (layer.type === 'fill' && sourceLayer === 'building') {
      return {
        ...layer,
        paint: { ...layer.paint, 'fill-color': '#d8b8a0', 'fill-outline-color': '#a98169' },
      };
    }
    return layer;
  }) as StyleSpecification['layers'];

  return [
    ...layers,
    {
      id: 'tour-basemap-landuse',
      type: 'fill',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'landuse',
      paint: { 'fill-color': '#dfe4c8', 'fill-opacity': 0.65 },
    },
    {
      id: 'tour-basemap-water',
      type: 'fill',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'water',
      paint: { 'fill-color': '#83bdc6', 'fill-opacity': 0.9 },
    },
    {
      id: 'tour-basemap-waterways',
      type: 'line',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'waterway',
      paint: {
        'line-color': '#4f96a3',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 18, 5],
      },
    },
    {
      id: 'tour-basemap-buildings',
      type: 'fill',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'building',
      minzoom: 13,
      paint: { 'fill-color': '#cda98f', 'fill-outline-color': '#8f6a55', 'fill-opacity': 0.9 },
    },
    {
      id: 'tour-basemap-roads-casing',
      type: 'line',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'transportation',
      paint: {
        'line-color': '#8f6f5e',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 14, 5, 18, 14],
      },
    },
    {
      id: 'tour-basemap-roads',
      type: 'line',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'transportation',
      paint: {
        'line-color': '#fffaf4',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.2, 14, 3, 18, 9],
      },
    },
    {
      id: 'tour-basemap-road-labels',
      type: 'symbol',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'transportation_name',
      minzoom: 13,
      layout: {
        'symbol-placement': 'line',
        'text-field': ['coalesce', ['get', 'name:vi'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
      },
      paint: { 'text-color': '#4d3429', 'text-halo-color': '#fffaf4', 'text-halo-width': 1.5 },
    },
    {
      id: 'tour-basemap-place-labels',
      type: 'symbol',
      source: PMTILES_SOURCE_ID,
      'source-layer': 'place',
      minzoom: 10,
      layout: {
        'text-field': ['coalesce', ['get', 'name:vi'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': 13,
      },
      paint: { 'text-color': '#4d3429', 'text-halo-color': '#fffaf4', 'text-halo-width': 1.5 },
    },
  ] as StyleSpecification['layers'];
}

export function createBasemapStyle(): StyleSpecification {
  ensurePmtilesProtocol();
  const pmtilesUrl = new URL('/tiles/vietnam.pmtiles', window.location.origin).href;
  return {
    ...(osmBrightStyle as StyleSpecification),
    layers: visibleBasemapLayers(osmBrightStyle as StyleSpecification),
    sources: {
      [PMTILES_SOURCE_ID]: {
        type: 'vector',
        url: `pmtiles://${pmtilesUrl}`,
        minzoom: 0,
        maxzoom: PMTILES_MAXZOOM,
        attribution:
          '<a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://osm.org/copyright">OpenStreetMap</a>',
      },
    },
  };
}
