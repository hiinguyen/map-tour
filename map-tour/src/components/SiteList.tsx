import { useMemo } from 'react';
import type { TourSite } from '../types';
import { footprintOf, formatAreaM2 } from '../lib/geo';

interface SiteListProps {
  sites: TourSite[];
  selectedId: string | null;
  onSelect: (id: string, source: 'list') => void;
  onOpenPanorama: (id: string) => void;
}

interface SiteGroup {
  category: string;
  sites: TourSite[];
}

function groupByCategory(sites: TourSite[]): SiteGroup[] {
  const order: string[] = [];
  const bySites = new Map<string, TourSite[]>();
  for (const site of sites) {
    if (!bySites.has(site.category)) {
      order.push(site.category);
      bySites.set(site.category, []);
    }
    bySites.get(site.category)?.push(site);
  }
  return order.map((category) => ({ category, sites: bySites.get(category) ?? [] }));
}

export function SiteList({ sites, selectedId, onSelect, onOpenPanorama }: SiteListProps) {
  const groups = useMemo(() => groupByCategory(sites), [sites]);

  return (
    <div className="site-list">
      {groups.map((group) => (
        <div className="site-list__group" key={group.category}>
          <h3 className="site-list__group-title">{group.category}</h3>
          <ul className="site-list__group-items">
            {group.sites.map((site) => (
              <li className="site-list__row" key={site.id}>
                <div className={site.id === selectedId ? 'site-list__row-inner site-list__row-inner--active' : 'site-list__row-inner'}>
                  <button
                    type="button"
                    className="site-list__item"
                    aria-pressed={site.id === selectedId}
                    onClick={() => onSelect(site.id, 'list')}
                  >
                    <span className="site-list__name">{site.name}</span>
                    <span className="site-list__meta">
                      {footprintOf(site) && site.areaM2
                        ? `Khu vực · ${formatAreaM2(site.areaM2)}`
                        : site.kind === 'point'
                        ? 'Điểm di tích'
                        : 'Khu vực'}
                    </span>
                  </button>
                  {site.panorama && (
                    <button
                      type="button"
                      className="site-list__panorama-btn"
                      aria-label={`Xem ảnh 360 độ của ${site.name}`}
                      onClick={() => onOpenPanorama(site.id)}
                    >
                      360°
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
