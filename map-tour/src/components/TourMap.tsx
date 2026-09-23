import { useEffect, useRef } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  LngLatBounds,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import { fetchRoute } from '../lib/api';
import { MAP_COLORS } from '../lib/mapColors';
import { getCategoryStyle } from '../lib/siteCategories';
import { createBasemapStyle } from '../lib/map/basemap';
import { footprintFeatureCollection } from '../lib/map/footprints';
import { siteCenter, toLngLat } from '../types';
import type { TourSite } from '../types';
import { footprintOf, footprintCenter, formatAreaM2 } from '../lib/geo';

const AREA_SOURCE_ID = 'tour-areas';
const AREA_FILL_LAYER_ID = 'tour-areas-fill';
const AREA_LINE_LAYER_ID = 'tour-areas-line';
const ROUTE_SOURCE_ID = 'tour-route';
const ROUTE_LINE_LAYER_ID = 'tour-route-line';
// Separate source/layer for the on-demand point-to-point "chỉ đường" feature
// (DirectionsPanel) — kept independent of the curated tour route above so
// both can be visible at once without one overwriting the other's data.
const DIRECTIONS_SOURCE_ID = 'tour-directions';
const DIRECTIONS_LINE_LAYER_ID = 'tour-directions-line';

// Icon badges and their label pills are a fixed screen-pixel size, so below
// this zoom a small area polygon can shrink to fewer screen-pixels than the
// badge itself, making the marker look like it "spills outside" the shape it
// marks even though its lat/lng anchor is exactly correct. Collapsing to an
// icon-only dot below this threshold keeps the marker visually proportionate
// to the shrunk geometry instead of looking misplaced.
const MARKER_LABEL_MIN_ZOOM = 16;
// Compact mode is also triggered when a site has a footprint whose projected
// screen span is smaller than MARKER_BADGE_SIZE * 1.5 — see compactForSite().

// Must match the non-compact .tour-marker/.tour-marker__badge box (32px) and
// the .tour-marker__label left offset (40px) in index.css — used to compute
// each marker's on-screen bounding box for collision detection below.
const MARKER_BADGE_SIZE = 32;
// Must match .tour-marker--compact/.tour-marker--compact .tour-marker__badge
// (18px) in index.css — used for the same collision math once markers switch
// to compact mode below MARKER_LABEL_MIN_ZOOM.
const MARKER_BADGE_SIZE_COMPACT = 18;
const MARKER_LABEL_LEFT_OFFSET = 40;
const MARKER_LABEL_GAP = 6;

// Ordered walking-tour stops — only the curated Ước Lễ sites (not the seeded
// random demo entries in sites.ts) get a real road/path route drawn between
// them, following the narrative order: gate -> đình -> chùa -> giếng ->
// old-village cluster -> craft-village cluster.
const TOUR_ROUTE_SITE_IDS = [
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000006',
];

// Wraps the API's shaped route response (map-tour/server/src/routes/routing.ts,
// proxying a self-hosted OSRM instance) as a GeoJSON feature ready to hand
// to a MapLibre source; returns null on any failure so callers can skip
// drawing rather than crash the rest of map setup.
async function fetchRouteFeature(coords: [number, number][]): Promise<GeoJSON.Feature<GeoJSON.LineString> | null> {
  try {
    const result = await fetchRoute(coords);
    return { type: 'Feature', properties: {}, geometry: result.geometry };
  } catch (error: unknown) {
    console.error('Failed to fetch walking route', error);
    return null;
  }
}

// Marker label sits beside the icon badge (not stacked above it), so nearby
// markers never have their name text covered by a neighboring pin. The
// wrapper element keeps a fixed 32x32 box (matching the badge) so MapLibre's
// center-anchor math stays exact even though the label overflows it visually.
function createMarkerElement(site: TourSite, onSelect: (id: string, source: 'map') => void): HTMLDivElement {
  const style = getCategoryStyle(site.category);
  const element = document.createElement('div');
  element.className = 'tour-marker';
  element.style.setProperty('--tour-marker-color', style.color);
  element.innerHTML = `
    <span class="tour-marker__badge">${style.icon}</span>
    <span class="tour-marker__count" aria-hidden="true"></span>
    <span class="tour-marker__label">${escapeHtml(site.name)}</span>
  `;
  element.setAttribute('role', 'button');
  element.setAttribute('tabindex', '0');
  element.setAttribute('aria-label', site.name);
  element.addEventListener('click', () => onSelect(site.id, 'map'));
  element.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect(site.id, 'map');
  });
  return element;
}

// Label width/height only depend on the site's name and the (static) marker
// CSS, so they're measured once right after the marker is added to the DOM
// and reused on every collision pass — reading offsetWidth/offsetHeight on
// every map "move" event would otherwise force a layout reflow per marker.
function cacheLabelSize(marker: Marker, siteId: string, labelSizes: Record<string, { width: number; height: number }>) {
  const labelElement = marker.getElement().querySelector<HTMLElement>('.tour-marker__label');
  if (!labelElement) return;
  labelSizes[siteId] = { width: labelElement.offsetWidth, height: labelElement.offsetHeight };
}

interface MarkerBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function badgeBox(centerX: number, centerY: number, badgeSize: number = MARKER_BADGE_SIZE): MarkerBox {
  const half = badgeSize / 2;
  return { left: centerX - half, right: centerX + half, top: centerY - half, bottom: centerY + half };
}

function labelBox(centerX: number, centerY: number, size: { width: number; height: number }): MarkerBox {
  const badge = badgeBox(centerX, centerY);
  const left = centerX - MARKER_BADGE_SIZE / 2 + MARKER_LABEL_LEFT_OFFSET;
  return {
    left: badge.left,
    right: left + size.width,
    top: Math.min(badge.top, centerY - size.height / 2),
    bottom: Math.max(badge.bottom, centerY + size.height / 2),
  };
}

function boxesOverlap(a: MarkerBox, b: MarkerBox): boolean {
  return (
    a.left - MARKER_LABEL_GAP < b.right &&
    a.right + MARKER_LABEL_GAP > b.left &&
    a.top - MARKER_LABEL_GAP < b.bottom &&
    a.bottom + MARKER_LABEL_GAP > b.top
  );
}

function setMarkerCount(element: HTMLElement, count: number) {
  const countElement = element.querySelector<HTMLElement>('.tour-marker__count');
  if (!countElement) return;
  countElement.textContent = count > 0 ? `+${count}` : '';
  countElement.classList.toggle('tour-marker__count--visible', count > 0);
}

// DOM markers don't get MapLibre's native symbol-layer collision detection
// (that only applies between GL-rendered symbol layers), so two independent
// markers whose real-world positions are close together (this village packs
// 21 points into ~400m, several only 10-50m apart) can collide on screen at
// ordinary zoom levels. A marker's label pill is much wider than its badge,
// so checking "does my badge overlap another badge" and "does my label
// overlap another label" as two separate passes misses the case where a
// lower-priority marker's *badge* lands inside an earlier marker's already-
// placed *label* — the badge pass alone would let it through, since it only
// ever compared badges to badges. This single greedy pass in priority order
// ("currently selected first, then original site order") avoids that: each
// marker is checked against the ACTUAL rendered extent (label pill, or bare
// badge if the label didn't fit) of every already-placed marker before it,
// with two shrinking fallbacks:
//   1. Try to show badge + label — if that full extent is clear, place it.
//   2. Else try badge-only — if just the badge is clear, place it with its
//      label hidden.
//   3. Else hide the marker entirely and "absorb" it into whichever
//      already-placed marker it collided with, which gets a "+N" count
//      bubble so it's visible that more points sit there instead of
//      silently vanishing. As the user zooms in, points spread apart on
//      screen and re-emerge on their own.
function resolveMarkerLayout(
  map: MapLibreMap,
  markers: Record<string, Marker>,
  orderedSiteIds: string[],
  labelSizes: Record<string, { width: number; height: number }>,
  selectedId: string | null,
  badgeSize: number,
) {
  const prioritized = [...orderedSiteIds].sort((a, b) => {
    if (a === selectedId) return -1;
    if (b === selectedId) return 1;
    return 0;
  });

  const placed: Array<{ siteId: string; box: MarkerBox }> = [];
  const absorbedCounts: Record<string, number> = {};

  for (const siteId of prioritized) {
    const marker = markers[siteId];
    if (!marker) continue;
    const element = marker.getElement();
    const point = map.project(marker.getLngLat());
    const size = labelSizes[siteId];
    const badgeOnlyBox = badgeBox(point.x, point.y, badgeSize);
    const fullBox = size ? labelBox(point.x, point.y, size) : badgeOnlyBox;

    if (!placed.some((entry) => boxesOverlap(fullBox, entry.box))) {
      element.classList.remove('tour-marker--hidden', 'tour-marker--label-hidden');
      setMarkerCount(element, 0);
      placed.push({ siteId, box: fullBox });
      continue;
    }

    if (!placed.some((entry) => boxesOverlap(badgeOnlyBox, entry.box))) {
      element.classList.remove('tour-marker--hidden');
      element.classList.add('tour-marker--label-hidden');
      setMarkerCount(element, 0);
      placed.push({ siteId, box: badgeOnlyBox });
      continue;
    }

    const absorbingEntry = placed.find((entry) => boxesOverlap(badgeOnlyBox, entry.box));
    if (absorbingEntry) absorbedCounts[absorbingEntry.siteId] = (absorbedCounts[absorbingEntry.siteId] ?? 0) + 1;
    element.classList.add('tour-marker--hidden');
  }

  for (const [siteId, count] of Object.entries(absorbedCounts)) {
    const marker = markers[siteId];
    if (marker) setMarkerCount(marker.getElement(), count);
  }
}

function siteBounds(sites: TourSite[]): LngLatBounds | null {
  if (sites.length === 0) return null;
  const bounds = new LngLatBounds();
  for (const site of sites) {
    const points = site.boundary && site.boundary.length > 0 ? site.boundary : [site.position];
    for (const point of points) bounds.extend(toLngLat(point));
  }
  return bounds;
}

function popupHtml(site: TourSite): string {
  const name = escapeHtml(site.name);
  const description = escapeHtml(site.description);
  // R14: dòng diện tích chỉ hiện khi site có ranh giới (footprintOf là guard
  // duy nhất cho dữ liệu KML lỗi). Point không ranh giới không có dòng này.
  const areaLine =
    footprintOf(site) && site.areaM2
      ? `<p class="map-popup__area">Diện tích: ${formatAreaM2(site.areaM2)}</p>`
      : '';
  const panoramaButton = site.panorama
    ? `<button type="button" class="popup-panorama-btn" data-site-id="${escapeHtml(site.id)}">Xem 360°</button>`
    : '';
  return `<div class="map-popup"><strong>${name}</strong><p>${description}</p>${areaLine}${panoramaButton}</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

interface TourMapProps {
  sites: TourSite[];
  selectedId: string | null;
  onSelect: (id: string, source: 'list' | 'map') => void;
  onOpenPanorama: (id: string) => void;
  /**
   * Nguồn phát ra selectedId hiện tại (R16). Bấm ghim hoặc polygon trên bản
   * đồ truyền 'map', bấm dòng sidebar truyền 'list', lần đầu đọc ?site= là
   * 'deeplink'. Mặc định 'list' để các trang chỉ xem bản đồ giữ hành vi cũ.
   */
  selectionSource?: 'deeplink' | 'list' | 'map';
  /** Point-to-point "chỉ đường" result to draw, or null to clear it. */
  directionsRoute?: GeoJSON.Feature<GeoJSON.LineString> | null;
}

export function TourMap({
  sites,
  selectedId,
  onSelect,
  onOpenPanorama,
  selectionSource = 'list',
  directionsRoute = null,
}: TourMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const selectedIdRef = useRef<string | null>(selectedId);
  // Holds the focusSite function once the map's load event fires, so the
  // selectedId effect can call it without attaching it to the MapLibre object.
  const focusSiteRef = useRef<((id: string, source: 'deeplink' | 'list' | 'map') => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current || sites.length === 0) return;

    let disposed = false;

    // Put the initial viewport inside the PMTiles archive before MapLibre
    // starts loading the style. Waiting for the style's `load` event to fit
    // the sites can leave the map at MapLibre's [0, 0] default, outside the
    // Vietnam source bounds, and prevent the tile load needed to reach that
    // event in some browsers.
    const initialBounds = siteBounds(sites)!;

    const style = createBasemapStyle();
    const map = new MapLibreMap({
      container: containerRef.current,
      style,
      bounds: initialBounds,
      fitBoundsOptions: { padding: 48, duration: 0 },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl(), 'top-right');

    // Popup content is raw HTML outside the React tree, so the "Xem 360°"
    // button inside it is caught via delegation instead of a per-popup
    // listener (popups are re-created/destroyed frequently as they open/close).
    const handlePopupClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('.popup-panorama-btn');
      const id = button?.getAttribute('data-site-id');
      if (id) onOpenPanorama(id);
    };
    containerRef.current.addEventListener('click', handlePopupClick);

    const footprintSites = sites.filter((site) => footprintOf(site) !== null);
    const pointSites = sites.filter((site) => footprintOf(site) === null);
    const areaSites = footprintSites;
    // Points before areas, matching creation order below — the order this
    // array is built in is also the tie-break priority used by
    // updateLabelCollisions when two markers' labels would overlap.
    const orderedSiteIds = [...pointSites, ...areaSites].map((site) => site.id);
    const labelSizes: Record<string, { width: number; height: number }> = {};

    map.on('load', () => {
      for (const site of pointSites) {
        const marker = new Marker({ element: createMarkerElement(site, onSelect) })
          .setLngLat(toLngLat(site.position))
          .setPopup(new Popup({ offset: 24 }).setHTML(popupHtml(site)))
          .addTo(map);
        markersRef.current[site.id] = marker;
        cacheLabelSize(marker, site.id, labelSizes);
      }

      map.addSource(AREA_SOURCE_ID, {
        type: 'geojson',
        data: footprintFeatureCollection(areaSites),
      });
      map.addLayer({
        id: AREA_FILL_LAYER_ID,
        type: 'fill',
        source: AREA_SOURCE_ID,
        paint: { 'fill-color': MAP_COLORS.secondaryContainer, 'fill-opacity': 0.28 },
      });
      map.addLayer({
        id: AREA_LINE_LAYER_ID,
        type: 'line',
        source: AREA_SOURCE_ID,
        paint: { 'line-color': MAP_COLORS.primary, 'line-width': 2 },
      });

      map.on('click', AREA_FILL_LAYER_ID, (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id;
        if (typeof id !== 'string') return;
        onSelect(id, 'map');
        new Popup({ offset: 12 })
          .setLngLat(event.lngLat)
          .setHTML(popupHtml(areaSites.find((site) => site.id === id)!))
          .addTo(map);
      });
      map.on('mouseenter', AREA_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', AREA_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });

      // Area polygons get the same icon+label marker as points, centered on
      // the footprint centroid (not the original point position), so the badge
      // always sits within the polygon it marks — even after KML import changes
      // the boundary without updating the stored position.
      for (const site of areaSites) {
        const marker = new Marker({ element: createMarkerElement(site, onSelect) })
          .setLngLat(toLngLat(footprintCenter(site)))
          .setPopup(new Popup({ offset: 24 }).setHTML(popupHtml(site)))
          .addTo(map);
        markersRef.current[site.id] = marker;
        cacheLabelSize(marker, site.id, labelSizes);
      }

      // Helper: minimum screen-pixel span of a site's boundary bounds.
      // Returns null for point sites (no footprint).
      function projectedSpanPx(site: TourSite): number | null {
        const fp = footprintOf(site);
        if (!fp) return null;
        const bounds = new LngLatBounds();
        for (const pt of fp) bounds.extend(toLngLat(pt));
        const sw = map.project(bounds.getSouthWest());
        const ne = map.project(bounds.getNorthEast());
        return Math.min(Math.abs(ne.x - sw.x), Math.abs(sw.y - ne.y));
      }

      // Per-site compact predicate:
      //   - site WITH footprint: collapse when its projected span is < badge*1.5
      //   - point site: collapse below MARKER_LABEL_MIN_ZOOM (global threshold)
      function compactForSite(site: TourSite): boolean {
        const span = projectedSpanPx(site);
        if (span !== null) return span < MARKER_BADGE_SIZE * 1.5;
        return map.getZoom() < MARKER_LABEL_MIN_ZOOM;
      }

      // Deep-link: focus camera on the selected site once layers are ready.
      // source='deeplink'|'list': always move.
      // source='map': skip if bounds already fill enough of the viewport.
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function focusSite(siteId: string, source: 'deeplink' | 'list' | 'map' = 'deeplink') {
        const site = sites.find((s) => s.id === siteId);
        if (!site) return;
        const fp = footprintOf(site);
        if (fp && fp.length >= 3) {
          const bounds = new LngLatBounds();
          for (const pt of fp) bounds.extend(toLngLat(pt));
          // Skip camera move only when triggered from the map itself (user
          // already looking at the target). Deep-links and sidebar clicks
          // always reframe, because the user navigated from outside the map.
          if (source === 'map') {
            const mapW = map.getContainer().clientWidth;
            const mapH = map.getContainer().clientHeight;
            const sw = map.project(bounds.getSouthWest());
            const ne = map.project(bounds.getNorthEast());
            const spanW = Math.abs(ne.x - sw.x);
            const inView =
              sw.x >= mapW * 0.075 && ne.x <= mapW * 0.925 &&
              ne.y >= mapH * 0.075 && sw.y <= mapH * 0.925 &&
              spanW >= mapW * 0.08;
            if (inView) return;
          }
          map.fitBounds(bounds, { padding: 60, maxZoom: 19, duration: prefersReducedMotion ? 0 : 600 });
        } else {
          map.easeTo({
            center: toLngLat(siteCenter(site)),
            zoom: Math.max(map.getZoom(), 17),
            duration: prefersReducedMotion ? 0 : 600,
          });
        }
      }
      // Store in ref so the selectedId effect can call it after mount (R11).
      focusSiteRef.current = focusSite;

      if (selectedIdRef.current) {
        focusSite(selectedIdRef.current, 'deeplink');
      }

      const updateMarkers = () => {
        // Each marker computes its own compact state: area sites use projected
        // footprint span; point sites fall back to the global zoom threshold.
        const globalCompact = map.getZoom() < MARKER_LABEL_MIN_ZOOM;
        let anyCompact = false;
        for (const site of [...pointSites, ...areaSites]) {
          const marker = markersRef.current[site.id];
          if (!marker) continue;
          const compact = compactForSite(site);
          marker.getElement().classList.toggle('tour-marker--compact', compact);
          if (compact) anyCompact = true;
        }
        const badgeSize = (anyCompact || globalCompact) ? MARKER_BADGE_SIZE_COMPACT : MARKER_BADGE_SIZE;
        resolveMarkerLayout(map, markersRef.current, orderedSiteIds, labelSizes, selectedIdRef.current, badgeSize);
      };
      updateMarkers();
      map.on('move', updateMarkers);

      // Fetch the real walking route for the curated tour stops in the
      // background so it doesn't delay the rest of map setup above.
      const routeSites = TOUR_ROUTE_SITE_IDS.map((id) => sites.find((site) => site.id === id)).filter(
        (site): site is TourSite => Boolean(site),
      );
      if (routeSites.length >= 2) {
        const routeCoords = routeSites.map((site) => toLngLat(siteCenter(site)));
        void fetchRouteFeature(routeCoords).then((routeFeature) => {
          if (disposed || !routeFeature) return;
          map.addSource(ROUTE_SOURCE_ID, {
            type: 'geojson',
            data: routeFeature,
          });
          map.addLayer({
            id: ROUTE_LINE_LAYER_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': MAP_COLORS.tertiaryContainer,
              'line-width': 4,
              'line-opacity': 0.85,
              'line-dasharray': [0.2, 1.5],
            },
          });
        });
      }
    });

    return () => {
      disposed = true;
      markersRef.current = {};
      containerRef.current?.removeEventListener('click', handlePopupClick);
      map.remove();
      mapRef.current = null;
      focusSiteRef.current = null;
    };
    // Sites arrive asynchronously from the active village API. The guard at
    // the start delays map creation until a non-empty dataset is available;
    // recreate it if the active village later supplies a different dataset.
  }, [sites]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    const map = mapRef.current;
    if (!map) return;

    for (const [id, marker] of Object.entries(markersRef.current)) {
      marker.getElement().classList.toggle('tour-marker--active', id === selectedId);
    }

    if (map.getLayer(AREA_LINE_LAYER_ID)) {
      map.setPaintProperty(AREA_LINE_LAYER_ID, 'line-width', [
        'case',
        ['==', ['get', 'id'], selectedId ?? ''],
        4,
        2,
      ]);
    }

    // Move the camera to the newly-selected site (R1).
    // R16: nguồn chọn quyết định "chỉ di khi cần". Bấm ghim/polygon là 'map'
    // nên có thể bị bỏ qua khi mục tiêu đã nằm gọn trong khung; sidebar là
    // 'list' nên luôn di chuyển camera.
    // KHÔNG chốt bằng map.isStyleLoaded() ở đây: setPaintProperty ngay phía
    // trên làm style bẩn nên isStyleLoaded() lập tức trả false, khiến mọi lần
    // chọn đều thoát sớm và camera không bao giờ di. focusSiteRef chỉ được gán
    // trong handler load, nên trước load nó là null và lời gọi này là no-op.
    if (selectedId) {
      focusSiteRef.current?.(selectedId, selectionSource);
    }

    // Re-run the same collision pass registered on the map's "move" event so
    // selecting a site immediately gives its label priority, instead of
    // waiting for the next pan/zoom to re-resolve overlaps.
    map.fire('move');
  }, [selectedId, selectionSource]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyDirectionsRoute = () => {
      const source = map.getSource<GeoJSONSource>(DIRECTIONS_SOURCE_ID);
      if (!directionsRoute) {
        source?.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      if (source) {
        source.setData(directionsRoute);
        return;
      }
      map.addSource(DIRECTIONS_SOURCE_ID, { type: 'geojson', data: directionsRoute });
      map.addLayer({
        id: DIRECTIONS_LINE_LAYER_ID,
        type: 'line',
        source: DIRECTIONS_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': MAP_COLORS.primaryContainer, 'line-width': 5, 'line-opacity': 0.9 },
      });
    };

    // The map's own "load" event (mount-time setup above) may not have fired
    // yet the first time this effect runs, e.g. if a directions request
    // resolves before markers/areas finish loading.
    if (map.isStyleLoaded()) applyDirectionsRoute();
    else map.once('load', applyDirectionsRoute);
  }, [directionsRoute]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
