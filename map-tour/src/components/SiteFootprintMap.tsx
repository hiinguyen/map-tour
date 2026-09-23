import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, ScaleControl, LngLatBounds } from 'maplibre-gl';
import type { LatLng } from '../types';
import { toLngLat } from '../types';
import { circlePolygon, formatAreaM2 } from '../lib/geo';
import { createBasemapStyle } from '../lib/map/basemap';
import {
  addEstimatedCircleLayers,
  addFootprintLayers,
  closedRing,
} from '../lib/map/footprints';
import { getCategoryStyle } from '../lib/siteCategories';

export interface SiteFootprintMapProps {
  name: string;
  category: string;
  footprint: LatLng[] | null;
  center: LatLng;
  areaM2?: number | null;
  spanM?: { width: number; height: number } | null;
  surveyedAreaM2?: number | null;
  estimatedRadiusM?: number | null;
  maxFitZoom?: number;
}

export function SiteFootprintMap({
  name,
  category,
  footprint,
  center,
  areaM2,
  spanM,
  surveyedAreaM2,
  estimatedRadiusM,
  maxFitZoom = 19,
}: SiteFootprintMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMapError, setHasMapError] = useState(false);
  // R17: giá trị thật của thước tỉ lệ đọc từ DOM MapLibre, cập nhật khi khung
  // lại. null nghĩa là chưa đọc được thì caption không thêm câu thước.
  const [scaleText, setScaleText] = useState<string | null>(null);

  const hasFootprint = Array.isArray(footprint) && footprint.length >= 3;
  const effectiveAreaM2 = hasFootprint ? (areaM2 ?? 0) : null;
  const radiusM = estimatedRadiusM ?? (surveyedAreaM2 && surveyedAreaM2 > 0 ? Math.sqrt(surveyedAreaM2 / Math.PI) : null);

  // Bounds calculation
  let targetRing: LatLng[] = [];
  if (hasFootprint) {
    targetRing = footprint;
  } else if (radiusM && radiusM > 0) {
    targetRing = circlePolygon(center, radiusM);
  } else {
    // 20m box around center if no polygon and no radius
    const deltaLat = 20 / 111195;
    const deltaLng = 20 / (111195 * Math.cos((center[0] * Math.PI) / 180));
    targetRing = [
      [center[0] - deltaLat, center[1] - deltaLng],
      [center[0] + deltaLat, center[1] + deltaLng],
    ];
  }

  const fitBounds = new LngLatBounds();
  for (const pt of targetRing) {
    fitBounds.extend(toLngLat(pt));
  }

  const footprintSignature = hasFootprint
    ? `${footprint.length}:${footprint[0]?.[0]}:${footprint[0]?.[1]}`
    : `estimate:${center[0]}:${center[1]}:${radiusM ?? 0}`;

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    setHasMapError(false);
    setScaleText(null);

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: createBasemapStyle(),
        interactive: false,
        attributionControl: { compact: true },
        bounds: fitBounds,
        fitBoundsOptions: { padding: 40, maxZoom: maxFitZoom, minZoom: 15, duration: 0 },
        zoomLevelsToOverscale: 6,
      });

      // R18: aria-hidden đặt lên đúng phần tử canvas, KHÔNG lên cả container.
      // Attribution của MapLibre là link bấm được (tabIndex 0); nếu container
      // bị aria-hidden thì chúng thành điểm dừng tab chết (WCAG aria-hidden-focus).
      // Canvas đã có tabindex -1 do interactive:false nên Tab vẫn bỏ qua nó.
      map.getCanvas().setAttribute('aria-hidden', 'true');

      map.addControl(new ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-left');

      // R17: đọc giá trị thật của thước từ DOM của ScaleControl và cập nhật
      // mỗi khi bản đồ khung lại. Không hardcode, vì review3.md đã đo thước
      // đổi giữa 50 m và 200 m theo bề rộng khung.
      const readScale = () => {
        if (disposed) return;
        const el = containerRef.current?.querySelector('.maplibregl-ctrl-scale');
        const text = el?.textContent?.trim() || null;
        setScaleText((prev) => (prev === text ? prev : text));
      };
      map.on('move', readScale);
      map.on('load', readScale);
      readScale();

      const refit = () => {
        if (disposed) return;
        map.fitBounds(fitBounds, { padding: 40, maxZoom: maxFitZoom, minZoom: 15, duration: 0 });
      };

      map.on('resize', refit);
      map.once('load', refit);

      map.on('error', (e) => {
        console.warn('MapLibre error in SiteFootprintMap:', e);
        if (!disposed && e.error && (e.error.message?.includes('fetch') || e.error.message?.includes('network'))) {
          setHasMapError(true);
          setScaleText(null);
        }
      });

      map.on('load', () => {
        if (disposed) return;

        if (hasFootprint) {
          const sourceId = 'site-footprint-src';
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { name, areaM2: effectiveAreaM2 },
                  geometry: {
                    type: 'Polygon',
                    coordinates: [closedRing(footprint)],
                  },
                },
              ],
            },
          });
          addFootprintLayers(map, sourceId);
        } else if (radiusM && radiusM > 0) {
          const sourceId = 'site-estimate-src';
          const circleRing = circlePolygon(center, radiusM);
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Polygon',
                    coordinates: [closedRing(circleRing)],
                  },
                },
              ],
            },
          });
          addEstimatedCircleLayers(map, sourceId);
        }

        // Center marker
        const style = getCategoryStyle(category);
        const el = document.createElement('div');
        el.className = 'tour-marker tour-marker--compact';
        el.style.backgroundColor = style.color;
        el.style.pointerEvents = 'none';
        el.setAttribute('aria-hidden', 'true');

        const badge = document.createElement('span');
        badge.className = 'tour-marker__badge';
        badge.innerHTML = style.icon;
        el.appendChild(badge);

        new Marker({ element: el }).setLngLat(toLngLat(center)).addTo(map);
      });
    } catch (err) {
      console.warn('Failed to initialize MapLibre in SiteFootprintMap:', err);
      setHasMapError(true);
    }

    return () => {
      disposed = true;
      if (map) {
        try {
          map.remove();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [footprintSignature, center[0], center[1], maxFitZoom]);

  // Chip logic
  let chipLabel = '';
  let chipAreaM2: number | null = null;
  let chipNote: string | null = null;
  let chipSurveyNote: string | null = null;
  let showChip = false;

  const hasSurvey = surveyedAreaM2 !== null && surveyedAreaM2 !== undefined && surveyedAreaM2 > 0;

  if (hasFootprint && effectiveAreaM2 !== null) {
    showChip = true;
    chipAreaM2 = effectiveAreaM2;
    if (spanM && spanM.width > 0 && spanM.height > 0) {
      chipNote = `≈ ${Math.round(spanM.width)} × ${Math.round(spanM.height)} m`;
    }
    if (hasSurvey) {
      const diffRatio = Math.abs(effectiveAreaM2 - surveyedAreaM2) / surveyedAreaM2;
      if (diffRatio > 0.15) {
        chipLabel = 'DIỆN TÍCH THEO RANH GIỚI';
        chipSurveyNote = `Số liệu khảo sát: ${formatAreaM2(surveyedAreaM2)}`;
      } else {
        chipLabel = 'DIỆN TÍCH KHUÔN VIÊN';
      }
    } else {
      chipLabel = 'DIỆN TÍCH KHUÔN VIÊN';
    }
  } else if (hasSurvey) {
    showChip = true;
    chipLabel = 'DIỆN TÍCH KHẢO SÁT';
    chipAreaM2 = surveyedAreaM2;
    if (radiusM) {
      chipNote = `bán kính phỏng đoán ≈ ${Math.round(radiusM)} m`;
    }
  }

  // Caption logic
  // R17: bản đồ khoá không thu phóng được, và toàn bộ vùng bản đồ nằm ngoài
  // accessibility tree, nên caption phải nói rõ điều đó. Câu gốc của cả ba
  // nhánh được giữ nguyên văn, chỉ nối thêm ở cuối. Thước tỉ lệ chỉ được đọc
  // khi có giá trị thật từ DOM; không hardcode con số.
  const LOCKED_MAP_SENTENCE = ' Bản đồ này không thu phóng được.';
  const scaleSentence = scaleText ? ` Thanh tỷ lệ: ${scaleText}.` : '';
  let captionText = '';
  if (hasFootprint && effectiveAreaM2 !== null) {
    const spanText = spanM ? `${Math.round(spanM.width)} × ${Math.round(spanM.height)} m` : '';
    captionText = `Ranh giới khuôn viên ${name} trên nền bản đồ làng. Diện tích khoảng ${formatAreaM2(effectiveAreaM2)}${spanText ? `, tương đương một khu đất chừng ${spanText}` : ''}.`;
    if (hasSurvey && surveyedAreaM2) {
      const diffRatio = Math.abs(effectiveAreaM2 - surveyedAreaM2) / surveyedAreaM2;
      if (diffRatio > 0.15) {
        captionText += ' Ranh giới vẽ trên bản đồ và số liệu khảo sát chênh nhau; số trên bản đồ là diện tích của hình vẽ.';
      }
    }
  } else if (hasSurvey && radiusM) {
    captionText = `Chưa khảo sát ranh giới. Vòng tròn nét đứt chỉ là phạm vi phỏng đoán quanh vị trí điểm, bán kính khoảng ${Math.round(radiusM)} m - không phải ranh giới thực của khuôn viên.`;
  } else {
    captionText = 'Chưa khảo sát ranh giới và chưa có số liệu diện tích. Bản đồ chỉ hiển thị vị trí của điểm di sản.';
  }
  captionText += LOCKED_MAP_SENTENCE + scaleSentence;

  return (
    <section className="landmark__section">
      <div className="landmark__section-head">
        <h2>Quy mô khuôn viên</h2>
        <p className="landmark__section-lead">
          Bản đồ dưới đây chỉ hiển thị riêng khu vực này, giữ nguyên tỷ lệ thật để thấy được hình dạng và độ rộng của khuôn viên.
        </p>
      </div>
      <figure className="footprint-map">
        <div className="footprint-map__frame">
          {hasMapError ? (
            <div className="footprint-map__fallback motif-lattice" aria-hidden="true">
              <p>Không tải được nền bản đồ. {chipAreaM2 ? `Diện tích khuôn viên: ${formatAreaM2(chipAreaM2)}.` : ''}</p>
            </div>
          ) : (
            <div ref={containerRef} className="footprint-map__canvas" />
          )}

          {!hasFootprint && <div className="footprint-map__badge">Chưa khảo sát ranh giới</div>}
        </div>

        {/* R19: chip là con trực tiếp của figure, không nằm trong khung. Ở bề
            ngang rộng nó nổi đè lên khung (absolute so với figure); ở bề ngang
            hẹp CSS đưa nó về dòng chảy bình thường ngay dưới khung, nên không
            còn chồng lấn và polygon lấy lại toàn bộ diện tích khung. */}
        {showChip && chipAreaM2 !== null && (
          <div className="map-area-chip">
            <div className="map-area-chip__label">{chipLabel}</div>
            <div className="map-area-chip__value">{formatAreaM2(chipAreaM2)}</div>
            {chipNote && <div className="map-area-chip__note">{chipNote}</div>}
            {chipSurveyNote && <div className="map-area-chip__survey">{chipSurveyNote}</div>}
          </div>
        )}

        <figcaption className="footprint-map__caption">{captionText}</figcaption>
      </figure>
    </section>
  );
}
