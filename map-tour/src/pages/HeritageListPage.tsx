import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { useSites } from '../context/SitesContext';
import { usePanorama } from '../context/PanoramaContext';
import { useVillage } from '../context/VillageContext';
import { villageLandmarkPath } from '../routes';
import type { TourSite } from '../types';

function sealCharacter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

const KIND_FILTERS: Array<{ value: 'all' | TourSite['kind']; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'point', label: 'Điểm di tích' },
  { value: 'area', label: 'Khu vực' },
];

export function HeritageListPage() {
  const [kindFilter, setKindFilter] = useState<'all' | TourSite['kind']>('all');
  const navigate = useNavigate();
  const { openPanorama } = usePanorama();
  const { sites, isLoading, error } = useSites();
  const { village } = useVillage();

  const filteredSites = useMemo(
    () => sites.filter((site) => kindFilter === 'all' || site.kind === kindFilter),
    [sites, kindFilter],
  );

  return (
    <div className="heritage-list">
      <header className="heritage-list__header">
        <h1>Danh sách Di sản</h1>
        <p>
          Các di tích &amp; khu vực di sản của {village?.name ?? '...'}
          {village?.adminLocation ? `, ${village.adminLocation}` : ''}.
        </p>
      </header>
      <div className="heritage-list__filters">
        {KIND_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={
              filter.value === kindFilter
                ? 'heritage-list__filter heritage-list__filter--active'
                : 'heritage-list__filter'
            }
            onClick={() => setKindFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {isLoading && <p className="heritage-list__status">Đang tải dữ liệu...</p>}
      {error && <p className="heritage-list__status heritage-list__status--error">{error}</p>}
      {!isLoading && !error && filteredSites.length === 0 && (
        <div className="heritage-list__empty">
          <span className="motif-seal" aria-hidden="true">
            ?
          </span>
          <h2>Chưa có điểm nào trong nhóm này</h2>
          <p>Thử chọn nhóm khác, hoặc xem tất cả điểm di sản của làng.</p>
        </div>
      )}
      <div className="heritage-list__grid">
        {filteredSites.map((site, index) => (
          <Reveal key={site.id} as="article" index={index} className="heritage-card">
            <div className="heritage-card__media">
              {site.cover ? (
                <img
                  className="heritage-card__image"
                  src={site.cover.url}
                  alt={site.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className="heritage-card__tile motif-lattice"
                  role="img"
                  aria-label={`Chưa có ảnh đại diện cho ${site.name}`}
                >
                  <span className="motif-seal" aria-hidden="true">
                    {sealCharacter(site.name)}
                  </span>
                </div>
              )}
            </div>
            <div className="heritage-card__body">
              <span
                className={
                  site.kind === 'area' ? 'heritage-card__badge heritage-card__badge--area' : 'heritage-card__badge'
                }
              >
                {site.kind === 'point' ? 'Điểm di tích' : 'Khu vực'}
              </span>
              <h2>
                <Link to={villageLandmarkPath(village?.slug ?? '', site.id)}>{site.name}</Link>
              </h2>
              <p className="heritage-card__category">{site.category}</p>
              <p className="heritage-card__description">{site.description}</p>
              <div className="heritage-card__actions">
                <button type="button" onClick={() => navigate(`../map?site=${site.id}`)}>
                  Xem trên bản đồ
                </button>
                {site.panorama && (
                  <button type="button" className="heritage-card__panorama-btn" onClick={() => openPanorama(site.id)}>
                    Xem 360°
                  </button>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
