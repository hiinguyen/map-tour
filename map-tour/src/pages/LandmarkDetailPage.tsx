import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PanoramaModal } from '../components/PanoramaModal';
import { Reveal } from '../components/Reveal';
import { SafeImage } from '../components/SafeImage';
import { SiteFootprintMap } from '../components/SiteFootprintMap';
import { fetchVillageDetails } from '../lib/api';
import { villageHeritagePath, villageHomePath, villageMapPath } from '../routes';
import type { SitePanorama, TourSite, VillageArchitectureHighlight, VillageDetails } from '../types';

type Photo = SitePanorama & { caption?: string | null };

/**
 * A landmark as this page needs it, assembled from the two collections the
 * village record keeps separately:
 *
 *   `sites`                  map geometry, category and a short description
 *   `architectureHighlights` the surveyed building profile and its photo set
 *
 * A place can appear in either or both. "Đình làng Ước Lễ" is in both, "Chùa
 * Sổ" only in the architecture survey, "Giếng Ngõ Phát" only on the map. The
 * page is addressed by whichever id the visitor arrived with, then the
 * counterpart is matched by name so the richest available record is shown.
 */
interface LandmarkRecord {
  /** Canonical id used when this page links to itself. */
  id: string;
  /**
   * Every id this record answers to. A merged landmark has two: the map site's
   * and the architecture survey's. The heritage list links by site id and the
   * architecture page by building id, so both must resolve to the same record.
   */
  ids: string[];
  name: string;
  site: TourSite | null;
  building: VillageArchitectureHighlight | null;
  photos: Photo[];
  panorama?: SitePanorama;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildRecord(site: TourSite | null, building: VillageArchitectureHighlight | null): LandmarkRecord | null {
  const source = building ?? site;
  if (!source) return null;

  const photos: Photo[] = building?.photos?.length
    ? building.photos
    : site?.cover
      ? [site.cover]
      : building?.cover
        ? [building.cover]
        : [];

  return {
    // The site id is canonical where one exists: it is the id already baked
    // into links from the heritage list and into `?site=` on the map.
    id: site?.id ?? source.id,
    ids: [site?.id, building?.id].filter((id): id is string => Boolean(id)),
    name: source.name,
    site,
    building,
    photos,
    panorama: building?.panorama ?? site?.panorama,
  };
}

/** Every landmark in the village, de-duplicated by name, in a stable order. */
function collectLandmarks(village: VillageDetails): LandmarkRecord[] {
  const buildingsByName = new Map(village.architectureHighlights.map((b) => [normalizeName(b.name), b]));
  const claimed = new Set<string>();

  const fromSites = village.sites.map((site) => {
    const key = normalizeName(site.name);
    const building = buildingsByName.get(key) ?? null;
    if (building) claimed.add(key);
    return buildRecord(site, building);
  });

  const buildingsOnly = village.architectureHighlights
    .filter((building) => !claimed.has(normalizeName(building.name)))
    .map((building) => buildRecord(null, building));

  return [...fromSites, ...buildingsOnly].filter((record): record is LandmarkRecord => record !== null);
}

interface Fact {
  label: string;
  value: string;
}

/**
 * Only facts the record actually holds. Nothing is padded out with placeholder
 * dashes, and no number is invented to make the grid look even.
 */
function buildFacts(record: LandmarkRecord): Fact[] {
  const { building, site } = record;
  const facts: Fact[] = [];

  const kind = building?.function ?? site?.category;
  if (kind) facts.push({ label: 'Loại hình', value: kind });

  if (building?.heritageRank) {
    facts.push({
      label: 'Xếp hạng',
      value: building.heritageRankYear
        ? `${building.heritageRank} (${building.heritageRankYear})`
        : building.heritageRank,
    });
  }

  if (building?.builtPeriod) facts.push({ label: 'Niên đại', value: building.builtPeriod });
  if (building?.structureMaterial) facts.push({ label: 'Vật liệu kết cấu', value: building.structureMaterial });
  if (building?.roofMaterial) facts.push({ label: 'Vật liệu mái', value: building.roofMaterial });
  if (building?.roofColor) facts.push({ label: 'Màu mái', value: building.roofColor });

  if (building?.landAreaM2) {
    facts.push({ label: 'Diện tích khuôn viên', value: `${building.landAreaM2.toLocaleString('vi-VN')} m²` });
  }
  if (building?.floorAreaM2) {
    facts.push({ label: 'Diện tích xây dựng', value: `${building.floorAreaM2.toLocaleString('vi-VN')} m²` });
  }

  return facts;
}

function sealCharacter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function LandmarkFallback({ name }: { name: string }) {
  return (
    <div className="landmark__fallback motif-lattice" role="img" aria-label={`Chưa có ảnh của ${name}`}>
      <span className="motif-seal" aria-hidden="true">
        {sealCharacter(name)}
      </span>
    </div>
  );
}

function Gallery({ record }: { record: LandmarkRecord }) {
  // The hero above already shows the first photograph. Opening the gallery on
  // the second one stops the two large frames being the same image, which on a
  // phone sit directly on top of each other. The filmstrip still lists all of
  // them, so the first is one tap away.
  const [activeIndex, setActiveIndex] = useState(record.photos.length > 1 ? 1 : 0);
  const active = record.photos[activeIndex] ?? record.photos[0];
  if (!active) return null;

  return (
    <>
      <div className="landmark__gallery-frame">
        <SafeImage src={active.url} alt={active.caption ?? record.name} />
      </div>
      {active.caption && <p className="landmark__gallery-caption">{active.caption}</p>}
      {record.photos.length > 1 && (
        <div className="landmark__filmstrip" role="list">
          {record.photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              role="listitem"
              className={index === activeIndex ? 'landmark__thumb landmark__thumb--active' : 'landmark__thumb'}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ảnh ${index + 1} của ${record.name}`}
              aria-current={index === activeIndex}
            >
              <SafeImage src={photo.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function NeighbourLink({
  record,
  direction,
  slug,
}: {
  record: LandmarkRecord;
  direction: 'prev' | 'next';
  slug: string;
}) {
  const cover = record.photos[0];

  return (
    <Link to={`${villageHeritagePath(slug)}/${record.id}`} className="landmark__neighbour">
      <div className="landmark__neighbour-media">
        {cover ? <SafeImage src={cover.url} alt="" /> : <div className="motif-lattice motif-lattice--fine" />}
      </div>
      <div className="landmark__neighbour-text">
        <span className="landmark__neighbour-dir">{direction === 'prev' ? 'Điểm trước' : 'Điểm tiếp theo'}</span>
        <span className="landmark__neighbour-name">{record.name}</span>
      </div>
    </Link>
  );
}

function LandmarkSkeleton() {
  return (
    <div className="landmark__skeleton" aria-busy="true" aria-label="Đang tải thông tin di sản">
      <div className="landmark__skeleton-media" />
      <div className="landmark__skeleton-lines">
        <div className="landmark__skeleton-line landmark__skeleton-line--title" />
        <div className="landmark__skeleton-line" />
        <div className="landmark__skeleton-line landmark__skeleton-line--short" />
      </div>
    </div>
  );
}

export function LandmarkDetailPage() {
  const { villageSlug, landmarkId } = useParams<{ villageSlug: string; landmarkId: string }>();
  const navigate = useNavigate();
  const [village, setVillage] = useState<VillageDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);
  const [isPanoramaOpen, setIsPanoramaOpen] = useState(false);

  const retry = useCallback(() => setRequestKey((key) => key + 1), []);

  useEffect(() => {
    if (!villageSlug) return;
    const controller = new AbortController();
    setError(null);
    fetchVillageDetails(villageSlug, controller.signal)
      .then(setVillage)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Không tải được thông tin di sản.');
      });
    return () => controller.abort();
  }, [villageSlug, requestKey]);

  const landmarks = useMemo(() => (village ? collectLandmarks(village) : []), [village]);
  const activeIndex = landmarks.findIndex((item) => landmarkId !== undefined && item.ids.includes(landmarkId));
  const record = activeIndex >= 0 ? landmarks[activeIndex] : null;

  // Closing on route change stops a neighbour's page opening with the previous
  // building's viewer still covering it.
  useEffect(() => setIsPanoramaOpen(false), [landmarkId]);

  useEffect(() => {
    if (!record || !village) return;
    const previousTitle = document.title;
    document.title = `${record.name} - ${village.name}`;
    return () => {
      document.title = previousTitle;
    };
  }, [record, village]);

  if (!villageSlug) return null;
  if (!village && !error) return <LandmarkSkeleton />;

  if (error) {
    return (
      <div className="landmark__state" role="alert">
        <span className="motif-seal" aria-hidden="true">
          !
        </span>
        <h1>Không mở được hồ sơ di sản</h1>
        <p>{error}</p>
        <div className="landmark__state-actions">
          <button type="button" className="landmark__btn landmark__btn--primary" onClick={retry}>
            Thử lại
          </button>
          <Link to={villageHeritagePath(villageSlug)} className="landmark__btn landmark__btn--ghost">
            Về danh sách di sản
          </Link>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="landmark__state">
        <span className="motif-seal" aria-hidden="true">
          ?
        </span>
        <h1>Không tìm thấy di sản này</h1>
        <p>Điểm di sản có thể đã được đổi tên hoặc gỡ khỏi hồ sơ của làng.</p>
        <div className="landmark__state-actions">
          <Link to={villageHeritagePath(villageSlug)} className="landmark__btn landmark__btn--primary">
            Về danh sách di sản
          </Link>
        </div>
      </div>
    );
  }

  const facts = buildFacts(record);
  const description = record.site?.description ?? null;
  const structure = record.building?.overallStructureDescription ?? null;
  const culturalValue = record.building?.culturalHistoricalValue ?? null;
  const kicker = record.building?.function ?? record.site?.category ?? null;
  const cover = record.photos[0];
  const previous = activeIndex > 0 ? landmarks[activeIndex - 1] : null;
  const next = activeIndex < landmarks.length - 1 ? landmarks[activeIndex + 1] : null;
  const siteId = record.site?.id;

  return (
    <article className="landmark">
      <nav className="landmark__breadcrumb" aria-label="Đường dẫn trang">
        <Link to={villageHomePath(villageSlug)}>{village?.name}</Link>
        <span aria-hidden="true">/</span>
        <Link to={villageHeritagePath(villageSlug)}>Di sản</Link>
        <span aria-hidden="true">/</span>
        <span>{record.name}</span>
      </nav>

      <header className="landmark__hero">
        <div className="landmark__hero-media">
          {cover ? <SafeImage src={cover.url} alt={record.name} eager /> : <LandmarkFallback name={record.name} />}
        </div>
        <div className="landmark__hero-body">
          <h1>{record.name}</h1>
          {kicker && <p className="landmark__kicker">{kicker}</p>}

          <ul className="landmark__tags">
            {record.building?.heritageRank && (
              <li className="landmark__tag landmark__tag--rank">{record.building.heritageRank}</li>
            )}
            {record.building?.builtPeriod && <li className="landmark__tag">{record.building.builtPeriod}</li>}
            {record.site && (
              <li className={record.site.kind === 'area' ? 'landmark__tag landmark__tag--area' : 'landmark__tag'}>
                {record.site.kind === 'point' ? 'Điểm di tích' : 'Khu vực'}
              </li>
            )}
          </ul>

          <div className="landmark__actions">
            {siteId && (
              <button
                type="button"
                className="landmark__btn landmark__btn--primary"
                onClick={() => navigate(`${villageMapPath(villageSlug)}?site=${siteId}`)}
              >
                Xem trong bản đồ làng
              </button>
            )}
            {record.panorama && (
              <button
                type="button"
                className="landmark__btn landmark__btn--ghost"
                onClick={() => setIsPanoramaOpen(true)}
              >
                Xem 360°
              </button>
            )}
          </div>
        </div>
      </header>

      {record.photos.length > 1 && (
        <Reveal as="section" className="landmark__section">
          <div className="landmark__section-head">
            <div className="motif-rule-start" aria-hidden="true" />
            <h2>Hình ảnh tư liệu</h2>
          </div>
          <Gallery record={record} />
        </Reveal>
      )}

      {facts.length > 0 && (
        <Reveal as="section" className="landmark__section">
          <div className="landmark__section-head">
            <h2>Thông tin khảo sát</h2>
          </div>
          <div className="landmark__facts">
            {facts.map((fact) => (
              <div key={fact.label} className="landmark__fact">
                <span className="landmark__fact-label">{fact.label}</span>
                <span className="landmark__fact-value">{fact.value}</span>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {record.site && (
        <SiteFootprintMap
          name={record.name}
          category={record.site.category}
          footprint={record.site.boundary ?? null}
          center={record.site.position}
          areaM2={record.site.areaM2}
          spanM={record.site.spanM}
          surveyedAreaM2={record.building?.landAreaM2}
          estimatedRadiusM={record.site.estimatedRadiusM}
        />
      )}

      {(description || structure || culturalValue) && (
        <Reveal as="section" className="landmark__section">
          <div className="landmark__section-head">
            <h2>Giới thiệu</h2>
          </div>
          <div className="landmark__prose">
            {description && (
              <div>
                <h3>Tổng quan</h3>
                <p>{description}</p>
              </div>
            )}
            {structure && (
              <div>
                <h3>Kết cấu công trình</h3>
                <p>{structure}</p>
              </div>
            )}
            {culturalValue && (
              <div>
                <h3>Giá trị văn hoá, lịch sử</h3>
                <p>{culturalValue}</p>
              </div>
            )}
          </div>
        </Reveal>
      )}

      {(previous || next) && (
        <Reveal as="section" className="landmark__section">
          <div className="landmark__section-head">
            <h2>Điểm di sản lân cận</h2>
          </div>
          <div className="landmark__neighbours">
            {previous && <NeighbourLink record={previous} direction="prev" slug={villageSlug} />}
            {next && <NeighbourLink record={next} direction="next" slug={villageSlug} />}
          </div>
        </Reveal>
      )}

      {isPanoramaOpen && (
        <PanoramaModal
          subject={{ name: record.name, panorama: record.panorama }}
          onClose={() => setIsPanoramaOpen(false)}
        />
      )}
    </article>
  );
}
