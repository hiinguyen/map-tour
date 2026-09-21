import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { fetchVillageDetails } from '../lib/api';
import { villageHomePath, villageIntroductionPath, villageLandmarkPath } from '../routes';
import { PanoramaViewer } from '../components/PanoramaViewer';
import { SafeImage } from '../components/SafeImage';
import type { VillageDetails } from '../types';

type Building = VillageDetails['architectureHighlights'][number];

function BuildingGallery({ building }: { building: Building }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPanorama, setShowPanorama] = useState(false);
  const activePhoto = building.photos[activeIndex] ?? building.photos[0];

  return (
    <div className="architecture-profile__media">
      {activePhoto ? (
        <SafeImage src={activePhoto.url} alt={building.name} className="architecture-profile__image" />
      ) : (
        <div className="architecture-profile__placeholder" aria-hidden="true">
          {building.name.charAt(0)}
        </div>
      )}
      {building.panorama && (
        <button type="button" className="architecture-profile__panorama-btn" onClick={() => setShowPanorama(true)}>
          Xem 360°
        </button>
      )}
      {building.photos.length > 1 && (
        <div className="architecture-profile__thumbs" role="list">
          {building.photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              role="listitem"
              className={
                index === activeIndex
                  ? 'architecture-profile__thumb architecture-profile__thumb--active'
                  : 'architecture-profile__thumb'
              }
              onClick={() => setActiveIndex(index)}
              aria-label={photo.caption ?? `${building.name} — ảnh ${index + 1}`}
            >
              <SafeImage src={photo.url} alt="" />
            </button>
          ))}
        </div>
      )}
      {showPanorama &&
        building.panorama &&
        createPortal(
          <div className="panorama-modal__backdrop" onClick={() => setShowPanorama(false)}>
            <div className="panorama-modal__content" onClick={(event) => event.stopPropagation()}>
              <div className="panorama-modal__header">
                <div>
                  <h2 className="panorama-modal__title">{building.name}</h2>
                  {building.panorama.attribution && (
                    <p className="panorama-modal__attribution">{building.panorama.attribution}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="panorama-modal__close"
                  onClick={() => setShowPanorama(false)}
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>
              <PanoramaViewer url={building.panorama.url} className="panorama-modal__viewer" />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function formatArea(m2: number | null): string | null {
  return m2 ? `${m2.toLocaleString('vi-VN')} m²` : null;
}

// See matching note in VillageIntroductionSections.tsx — some source rows
// carry a full sentence in "built period" rather than a short date/era.
function isTagLength(value: string | null): value is string {
  return Boolean(value) && value!.length <= 24;
}

export function ArchitectureHighlightsPage() {
  const { villageSlug } = useParams<{ villageSlug: string }>();
  const [village, setVillage] = useState<VillageDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!villageSlug) return;
    const controller = new AbortController();
    fetchVillageDetails(villageSlug, controller.signal)
      .then(setVillage)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Không tải được thông tin làng.');
        }
      });
    return () => controller.abort();
  }, [villageSlug]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = village ? `Kiến trúc độc đáo - ${village.name}` : 'Kiến trúc độc đáo';
    return () => {
      document.title = previousTitle;
    };
  }, [village]);

  if (!village && !error) return <p className="app__route-loading">Đang tải...</p>;
  if (!village) {
    return (
      <div className="village-state" role="alert">
        <span>Không thể mở trang kiến trúc</span>
        <h1>Thông tin đang tạm gián đoạn</h1>
        <p>{error}</p>
        <Link to={villageSlug ? villageHomePath(villageSlug) : '/'}>Quay về trang chủ</Link>
      </div>
    );
  }

  return (
    <article className="architecture-page">
      <nav className="village-breadcrumb" aria-label="Đường dẫn trang">
        <Link to={villageHomePath(village.slug)}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <Link to={villageIntroductionPath(village.slug)}>Giới thiệu {village.name}</Link>
        <span aria-hidden="true">/</span>
        <span>Kiến trúc độc đáo</span>
      </nav>

      <header className="architecture-page__header">
        <span>Di sản kiến trúc {village.name}</span>
        <h1>Kiến trúc độc đáo</h1>
        <p>
          Những công trình cổ còn lưu giữ nguyên vẹn kết cấu, vật liệu và giá trị văn hóa và lịch sử của{' '}
          {village.name}, khảo sát chi tiết từ đình, chùa đến nhà cổ trong làng.
        </p>
      </header>

      {village.architectureHighlights.length === 0 ? (
        <p className="architecture-page__empty">Chưa có dữ liệu kiến trúc chi tiết cho làng này.</p>
      ) : (
        <div className="architecture-page__list">
          {village.architectureHighlights.map((building) => (
            <article className="architecture-profile" key={building.id} id={building.id}>
              <BuildingGallery building={building} />
              <div className="architecture-profile__body">
                <div className="architecture-profile__tags">
                  {building.function && <span>{building.function}</span>}
                  {isTagLength(building.builtPeriod) && <span>{building.builtPeriod}</span>}
                  {building.heritageRank && (
                    <span>
                      {building.heritageRank}
                      {building.heritageRankYear ? ` (${building.heritageRankYear})` : ''}
                    </span>
                  )}
                </div>
                <h2>
                  <Link to={villageLandmarkPath(village.slug, building.id)}>{building.name}</Link>
                </h2>
                {building.overallStructureDescription && <p>{building.overallStructureDescription}</p>}
                {building.culturalHistoricalValue && <p>{building.culturalHistoricalValue}</p>}
                {!isTagLength(building.builtPeriod) && building.builtPeriod && (
                  <p className="architecture-profile__note">
                    <strong>Niên đại: </strong>
                    {building.builtPeriod}
                  </p>
                )}

                {(formatArea(building.landAreaM2) ||
                  formatArea(building.floorAreaM2) ||
                  building.roofMaterial ||
                  building.structureMaterial) && (
                  <dl className="architecture-profile__facts">
                    {formatArea(building.landAreaM2) && (
                      <div>
                        <dt>Diện tích đất</dt>
                        <dd>{formatArea(building.landAreaM2)}</dd>
                      </div>
                    )}
                    {formatArea(building.floorAreaM2) && (
                      <div>
                        <dt>Diện tích xây dựng</dt>
                        <dd>{formatArea(building.floorAreaM2)}</dd>
                      </div>
                    )}
                    {building.roofMaterial && (
                      <div>
                        <dt>Mái</dt>
                        <dd>{[building.roofMaterial, building.roofColor].filter(Boolean).join(', ')}</dd>
                      </div>
                    )}
                    {building.structureMaterial && (
                      <div>
                        <dt>Kết cấu</dt>
                        <dd>{building.structureMaterial}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <footer className="architecture-page__footer">
        <Link className="village-button village-button--gold" to={villageIntroductionPath(village.slug)}>
          ← Quay lại trang giới thiệu
        </Link>
      </footer>
    </article>
  );
}
