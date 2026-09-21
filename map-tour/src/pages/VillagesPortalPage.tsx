import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { fetchVillages } from '../lib/api';
import type { Village } from '../types';

const BLURB_MAX = 116;
/** Above this length a single entry is prose, not the name of a trade. */
const OCCUPATION_IS_PROSE = 46;

function sealCharacter(name: string): string {
  const distinctive = name.replace(/^Làng\s+/i, '').trim();
  return (distinctive || name).charAt(0).toUpperCase();
}

/**
 * Trims to a whole word and repairs what the cut leaves behind: trailing
 * punctuation (so a source ending in "sản..." does not become "sản...…") and
 * an opening bracket whose closing partner was cut away.
 */
function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/[\s.,;:]+$/, '');
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  let result = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;

  const opens = (result.match(/\(/g) ?? []).length;
  const closes = (result.match(/\)/g) ?? []).length;
  if (opens > closes) result = result.slice(0, result.lastIndexOf('('));

  return `${result.replace(/[\s.,;:(]+$/, '')}…`;
}

/**
 * Builds the one-line description under a village name.
 *
 * `mainOccupations` is not reliably a list. For some villages the importer
 * split a whole descriptive sentence on its commas, so the array comes back as
 * sentence fragments: Làng Cựu's first entry is the bare clause "Trước đây",
 * and Làng Chuông's is "Việc làm nón được thực hiện 100% bằng tay".
 *
 * So the shape is detected before the text is used. A genuine short list of
 * trades reads naturally after "Nổi tiếng với"; a split sentence is rejoined
 * into the original prose and shown on its own, because no prefix can be
 * grafted onto an arbitrary clause and still be grammatical.
 */
function buildVillageBlurb(village: Village): string | null {
  const occupations = village.mainOccupations.map((item) => item.trim()).filter(Boolean);

  if (occupations.length > 0) {
    const isProse = occupations.some((item) => item.length > OCCUPATION_IS_PROSE);
    if (isProse) {
      const sentence = truncate(occupations.join(', '), BLURB_MAX);
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    const trades = truncate(occupations.join(', '), BLURB_MAX);
    return `Nổi tiếng với ${trades.charAt(0).toLowerCase()}${trades.slice(1)}.`;
  }

  if (village.foundedPeriod) {
    return `Hình thành từ ${village.foundedPeriod}, còn gìn giữ nhiều giá trị di sản truyền thống.`;
  }

  return null;
}

function LocationLine({ location }: { location: string }) {
  return (
    <p className="portal__village-location">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7 11.44a1.5 1.5 0 0 0 2 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
      </svg>
      {location}
    </p>
  );
}

function VillageCover({ village, className }: { village: Village; className?: string }) {
  if (village.coverUrl) {
    return (
      <img
        className={className}
        src={village.coverUrl}
        alt={`Cảnh ${village.name}`}
        loading="lazy"
        decoding="async"
        width={800}
        height={600}
      />
    );
  }

  return (
    <div className="portal__village-fallback motif-lattice" role="img" aria-label={`Chưa có ảnh của ${village.name}`}>
      <span className="motif-seal" aria-hidden="true">
        {sealCharacter(village.name)}
      </span>
    </div>
  );
}

function VillageCard({ village, index }: { village: Village; index: number }) {
  const blurb = buildVillageBlurb(village);

  return (
    <Reveal index={index}>
      <Link to={`/lang/${village.slug}/gioi-thieu`} className="portal__village-card">
        <div className="portal__village-media">
          <VillageCover village={village} className="portal__village-image" />
        </div>
        <div className="portal__village-body">
          <h3>{village.name}</h3>
          {village.adminLocation && <LocationLine location={village.adminLocation} />}
          {blurb && <p className="portal__village-blurb">{blurb}</p>}
          <span className="portal__village-link">
            Khám phá <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

function FeatureVillage({ village }: { village: Village }) {
  const blurb = buildVillageBlurb(village);

  return (
    <Reveal>
      <Link to={`/lang/${village.slug}/gioi-thieu`} className="portal__feature">
        <div className="portal__feature-media">
          <VillageCover village={village} />
        </div>
        <div className="portal__feature-body">
          <h3>{village.name}</h3>
          {village.adminLocation && <LocationLine location={village.adminLocation} />}
          {blurb && <p className="portal__village-blurb">{blurb}</p>}
          <span className="portal__village-link">
            Khám phá <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

function VillageGridSkeleton() {
  return (
    <div className="portal__skeleton-grid" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((key) => (
        <div key={key} className="portal__skeleton">
          <div className="portal__skeleton-media" />
          <div className="portal__skeleton-body">
            <div className="portal__skeleton-line portal__skeleton-line--title" />
            <div className="portal__skeleton-line" />
            <div className="portal__skeleton-line portal__skeleton-line--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VillagesPortalPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await fetchVillages();
        if (!controller.signal.aborted) {
          setVillages(data);
          setError(null);
        }
      } catch (cause: unknown) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Không tải được danh sách làng.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const [feature, ...rest] = villages;
  const hasVillages = villages.length > 0;

  return (
    <div className="portal">
      <header className="portal__header">
        <div className="portal__header-inner">
          <Link to="/" className="portal__brand">
            <span className="motif-seal" aria-hidden="true">
              Ð
            </span>
            Làng nghề di sản Việt Nam
          </Link>
        </div>
      </header>

      <section className="portal__hero">
        <div className="portal__hero-content">
          <h1>
            Hành trình
            <br />
            khám phá di sản
          </h1>
          <p className="portal__hero-lead">
            Chạm vào linh hồn làng quê Việt: kiến trúc cổ, nghề thủ công tinh xảo và chuyện văn hoá ngàn năm.
          </p>
          <a className="portal__hero-cta" href="#portal-villages">
            Bắt đầu hành trình <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="portal__hero-media">
          <img
            src="/lang-que-8.jpg"
            alt="Đàn trâu về làng lúc hoàng hôn trên cánh đồng đồng bằng sông Hồng"
            width={1600}
            height={1000}
            decoding="async"
          />
        </div>
      </section>

      <section className="portal__villages" id="portal-villages">
        <div className="portal__villages-heading">
          <div className="motif-rule-start" aria-hidden="true" />
          <h2>Làng di sản tiêu biểu</h2>
          <p>Những điểm đến gìn giữ trọn vẹn tinh hoa nghề truyền thống và kiến trúc cổ.</p>
        </div>

        {error && (
          <p className="portal__status portal__status--error" role="alert">
            {error}
          </p>
        )}

        {isLoading && <VillageGridSkeleton />}

        {!isLoading && !error && !hasVillages && (
          <div className="portal__empty">
            <span className="motif-seal" aria-hidden="true">
              Ð
            </span>
            <h3>Chưa có làng nào trong hệ thống</h3>
            <p>Danh sách sẽ xuất hiện ở đây ngay khi hồ sơ làng đầu tiên được số hoá.</p>
          </div>
        )}

        {!isLoading && hasVillages && (
          <>
            <FeatureVillage village={feature} />
            {rest.length > 0 && (
              <div className="portal__village-grid">
                {rest.map((village, index) => (
                  <VillageCard key={village.id} village={village} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <footer className="portal__footer">
        <div className="portal__footer-inner">
          <p>
            Hồ sơ số hoá làng nghề truyền thống vùng đồng bằng sông Hồng, thuộc đề tài nghiên cứu du lịch thông minh.
          </p>
        </div>
      </footer>
    </div>
  );
}
