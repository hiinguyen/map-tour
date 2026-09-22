import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePanorama } from '../context/PanoramaContext';
import { Reveal } from './Reveal';
import { villageArchitecturePath, villageHeritagePath, villageMapPath, villagePanoramaPath } from '../routes';
import type { TourSite, VillageDetails } from '../types';
import { SafeImage } from './SafeImage';
import { TourMap } from './TourMap';

export function VillageHero({ village }: { village: VillageDetails }) {
  const heroImage = village.gallery[0];
  const eyebrow = [village.foundedPeriod, village.brandIdentity].filter(Boolean).join(' · ');

  return (
    <section className={`village-hero${heroImage ? ' village-hero--with-image' : ''}`}>
      {heroImage && <SafeImage src={heroImage.url} alt={heroImage.alt} className="village-hero__image" eager />}
      <div className="village-hero__veil" />
      <div className="village-hero__content">
        {eyebrow && <p className="village-hero__eyebrow">{eyebrow}</p>}
        <h1>{village.name}</h1>
        {village.aliases.length > 0 && <p className="village-hero__alias">Còn được gọi là {village.aliases.join(', ')}</p>}
        {village.currentAdminLocation && <p className="village-hero__location">⌖ {village.currentAdminLocation}</p>}
        <div className="village-hero__actions">
          <Link className="village-button village-button--gold" to={villageHeritagePath(village.slug)}>
            Khám phá di sản
          </Link>
          <Link className="village-button village-button--light" to={villageMapPath(village.slug)}>
            Xem trên bản đồ
          </Link>
          {village.statistics.panoramaCount > 0 && (
            <Link className="village-button village-button--light" to={villagePanoramaPath(village.slug)}>
              Trải nghiệm 360°
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function VillageQuickFacts({ village }: { village: VillageDetails }) {
  const facts = [
    { value: village.statistics.pointCount, label: 'Điểm di tích' },
    { value: village.statistics.areaCount, label: 'Khu vực văn hóa' },
    { value: village.statistics.panoramaCount, label: 'Trải nghiệm 360°' },
    { value: village.statistics.imageCount, label: 'Ảnh tư liệu' },
  ].filter((fact) => fact.value > 0);

  if (facts.length === 0) return null;
  return (
    <section className="village-facts" aria-label="Thông tin nhanh">
      {facts.map((fact, index) => (
        <Reveal className="village-fact" index={index} key={fact.label}>
          <strong>{fact.value}</strong>
          <span>{fact.label}</span>
        </Reveal>
      ))}
    </section>
  );
}

export function VillageOverview({ village }: { village: VillageDetails }) {
  const hasDetails = Boolean(village.overview) || village.aliases.length > 0 || village.mainOccupations.length > 0;
  if (!hasDetails) return null;

  // Most villages have no `overview` prose yet, which left the whole left
  // column of this grid blank next to a tall facts card. A photograph carries
  // the column until the text exists, and still earns its place beside it
  // once it does. gallery[0] is already the hero, so start one further in.
  const galleryImage = village.gallery[1] ?? village.gallery[0] ?? null;
  const image =
    galleryImage ?? (village.coverUrl ? { url: village.coverUrl, alt: village.name } : null);
  const hasProse = Boolean(village.overview);
  // Ước Lễ has neither prose nor a single photograph on file. Rather than park
  // the facts card beside an empty half, let it run the full width.
  const isCardOnly = !hasProse && !image;

  return (
    <section className="village-section village-overview" aria-labelledby="village-overview-title">
      <div className="village-section__heading">
        <span>Hồ sơ làng</span>
        <h2 id="village-overview-title">Tổng quan về {village.name}</h2>
      </div>
      <div className={`village-overview__grid${isCardOnly ? ' village-overview__grid--card-only' : ''}`}>
        {!isCardOnly && (
        <div className="village-overview__main">
          {hasProse && (
            <div className="village-prose">
              <TextParagraphs text={village.overview!} />
            </div>
          )}
          {image && (
            <figure
              className={`village-overview__media${hasProse ? '' : ' village-overview__media--solo'}`}
            >
              <SafeImage src={image.url} alt={image.alt} className="village-overview__image" />
              <figcaption>{image.alt}</figcaption>
            </figure>
          )}
        </div>
        )}
        <aside className="village-detail-card" aria-label="Thông tin làng">
          {village.currentAdminLocation && (
            <div><span>Địa giới hiện tại</span><strong>{village.currentAdminLocation}</strong></div>
          )}
          {village.previousAdminLocation && (
            <div><span>Địa giới trước đây</span><strong>{village.previousAdminLocation}</strong></div>
          )}
          {village.aliases.length > 0 && (
            <div><span>Tên gọi khác</span><strong>{village.aliases.join(', ')}</strong></div>
          )}
          {village.mainOccupations.length > 0 && (
            <div><span>Nghề chính</span><strong>{village.mainOccupations.join(', ')}</strong></div>
          )}
          {village.foundedPeriod && (
            <div><span>Thời điểm hình thành</span><strong>{village.foundedPeriod}</strong></div>
          )}
          {village.brandIdentity && (
            <div><span>Định danh</span><strong>{village.brandIdentity}</strong></div>
          )}
          {village.googleMapsLink && (
            <a href={village.googleMapsLink} target="_blank" rel="noreferrer">Mở vị trí trên Google Maps ↗</a>
          )}
        </aside>
      </div>
    </section>
  );
}

export function VillageNameMeaning({ village }: { village: VillageDetails }) {
  if (!village.nameMeaning) return null;
  return (
    <section className="village-section village-name-meaning" aria-labelledby="village-name-title">
      <div className="village-name-meaning__mark" aria-hidden="true">{village.name.split(/\s+/).join(' · ')}</div>
      <div>
        <h2 id="village-name-title">Danh xưng {village.name}</h2>
        <blockquote>{village.nameMeaning}</blockquote>
      </div>
    </section>
  );
}

export function VillageHistory({ village }: { village: VillageDetails }) {
  if (village.timeline.length === 0) return null;

  return (
    <section className="village-section village-history" aria-labelledby="village-history-title">
      <Reveal className="village-section__heading">
        <span>Ký ức và nguồn cội</span>
        <h2 id="village-history-title">Lịch sử hình thành</h2>
      </Reveal>
      <div className="village-timeline">
          {village.timeline.map((item, index) => (
            <Reveal as="article" className="village-timeline__item" index={index} key={item.id}>
              {item.period && <time className="village-timeline__period">{item.period}</time>}
              <span className="village-timeline__type">{historyLabel(item.type)}</span>
              <h3>{item.title}</h3>
              {item.body && <TextParagraphs text={item.body} />}
            </Reveal>
          ))}
      </div>
    </section>
  );
}

export function VillageCulturalStories({ village }: { village: VillageDetails }) {
  const hasContent = village.customs.length > 0 || village.culturalStories.length > 0 || village.legends.length > 0;
  if (!hasContent) return null;

  return (
    <section className="village-section" aria-labelledby="village-cultural-stories-title">
      <Reveal className="village-section__heading village-section__heading--center">
        <h2 id="village-cultural-stories-title">Phong tục và nghĩa tình {village.name}</h2>
      </Reveal>
      <div className="village-story-grid">
        {village.customs.map((story, index) => <VillageStoryCard key={story.id} story={story} tone="gold" index={index} />)}
        {village.culturalStories.map((story, index) => <VillageStoryCard key={story.id} story={story} tone="paper" index={village.customs.length + index} />)}
        {village.legends.map((story, index) => <VillageStoryCard key={story.id} story={story} tone="red" index={village.customs.length + village.culturalStories.length + index} />)}
      </div>
    </section>
  );
}

function VillageStoryCard({
  story,
  tone,
  index,
}: {
  story: VillageDetails['history'][number];
  tone: 'gold' | 'paper' | 'red';
  index: number;
}) {
  return (
    <Reveal as="article" className={`village-story-card village-story-card--${tone}`} index={index}>
      <span>{historyLabel(story.type)}</span>
      <h3>{story.title}</h3>
      {story.body && <TextParagraphs text={story.body} />}
    </Reveal>
  );
}

export function VillageLandscape({ village }: { village: VillageDetails }) {
  if (!village.naturalFeatures && !village.morphologyDescription) return null;
  const image = village.gallery[4] ?? village.gallery[0];
  return (
    <section className="village-section village-landscape" aria-labelledby="village-landscape-title">
      <div className="village-landscape__content">
        <h2 id="village-landscape-title">Thiên nhiên và hình thái làng</h2>
        {village.naturalFeatures && <TextParagraphs text={village.naturalFeatures} />}
        {village.morphologyDescription && <TextParagraphs text={village.morphologyDescription} />}
      </div>
      {image && <SafeImage src={image.url} alt={`Không gian ${village.name}`} className="village-landscape__image" />}
    </section>
  );
}

function historyLabel(type: VillageDetails['history'][number]['type']) {
  return { lich_su: 'Lịch sử', su_kien: 'Sự kiện', phong_tuc: 'Phong tục', truyen_thuyet: 'Truyền thuyết' }[type];
}

function architectureExcerpt(highlight: VillageDetails['architectureHighlights'][number]): string | null {
  const text = highlight.culturalHistoricalValue ?? highlight.overallStructureDescription;
  if (!text) return null;
  return text.length > 160 ? `${text.slice(0, 160).trimEnd()}…` : text;
}

// Some source rows carry a full sentence in "built period" instead of a short
// date/era (e.g. "Không ai còn nhớ rõ - thời điểm trùng tu lần đầu tiên..."),
// which breaks the compact tag/badge UI — only show it there when it reads
// like an actual period label; the full sentence still surfaces on the
// architecture detail page (see ArchitectureHighlightsPage.tsx).
function isTagLength(value: string | null): value is string {
  return Boolean(value) && value!.length <= 24;
}

export function VillageArchitecture({ village }: { village: VillageDetails }) {
  const { architectureHighlights } = village;
  if (architectureHighlights.length === 0) return null;

  return (
    <section className="village-section" aria-labelledby="village-architecture-title">
      <Reveal className="village-section__heading village-section__heading--center">
        <h2 id="village-architecture-title">Kiến trúc độc đáo</h2>
      </Reveal>
      <div className="village-architecture-grid">
        {architectureHighlights.map((highlight, index) => (
          <Reveal key={highlight.id} index={index}>
            <Link className="village-architecture-card" to={villageArchitecturePath(village.slug)}>
              <div className="village-architecture-card__media">
                {highlight.cover ? (
                  <SafeImage src={highlight.cover.url} alt={highlight.name} className="village-architecture-card__image" />
                ) : (
                  <div className="village-architecture-card__placeholder" aria-hidden="true">{highlight.name.charAt(0)}</div>
                )}
                {highlight.panorama && <span className="village-architecture-card__badge-360">360°</span>}
              </div>
              <div className="village-architecture-card__body">
                {(isTagLength(highlight.builtPeriod) || highlight.heritageRank) && (
                  <span>
                    {[isTagLength(highlight.builtPeriod) ? highlight.builtPeriod : null, highlight.heritageRank]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
                <h3>{highlight.name}</h3>
                {architectureExcerpt(highlight) && <p>{architectureExcerpt(highlight)}</p>}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <Reveal className="village-architecture__cta">
        <Link className="village-button village-button--gold" to={villageArchitecturePath(village.slug)}>
          Khám phá kiến trúc độc đáo →
        </Link>
      </Reveal>
    </section>
  );
}

export function VillageCulture({ sites, villageSlug }: { sites: TourSite[]; villageSlug: string }) {
  const { openPanorama } = usePanorama();
  if (sites.length === 0) return null;

  return (
    <section className="village-section" aria-labelledby="village-culture-title">
      <Reveal className="village-section__heading village-section__heading--center">
        <h2 id="village-culture-title">Di sản và không gian văn hóa</h2>
      </Reveal>
      <div className="village-sites-grid">
        {sites.map((site, index) => (
          <Reveal as="article" className="village-site-card" index={index} key={site.id}>
            <div className="village-site-card__media">
              {site.cover ? (
                <SafeImage src={site.cover.url} alt={site.name} className="village-site-card__image" />
              ) : (
                <div className="village-site-card__placeholder" aria-hidden="true">{site.name.charAt(0)}</div>
              )}
            </div>
            <div className="village-site-card__body">
              <span>{site.category}</span>
              <h3>{site.name}</h3>
              {site.description && <p>{site.description}</p>}
              <div className="village-site-card__actions">
                <Link to={`${villageMapPath(villageSlug)}?site=${site.id}`}>Xem trên bản đồ</Link>
                {site.panorama && <button type="button" onClick={() => openPanorama(site.id)}>Xem 360°</button>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function TraditionalCraft({ village }: { village: VillageDetails }) {
  const craftSite = village.sites.find((site) => site.category === 'Làng nghề');
  const hasCraftData = Boolean(village.traditionalCraft) || village.mainOccupations.length > 0 || village.craftProducts.length > 0 || craftSite;
  if (!hasCraftData) return null;

  return (
    <section className="village-section village-craft" aria-labelledby="village-craft-title">
      {craftSite?.cover && <SafeImage src={craftSite.cover.url} alt={craftSite.name} className="village-craft__image" />}
      <div className="village-craft__content">
        <h2 id="village-craft-title">Nghề truyền thống {village.name}</h2>
        {village.traditionalCraft ? <TextParagraphs text={village.traditionalCraft} /> : craftSite?.description && <p>{craftSite.description}</p>}
        {village.mainOccupations.length > 0 && (
          <ul>{village.mainOccupations.map((occupation) => <li key={occupation}>{occupation}</li>)}</ul>
        )}
        {village.craftProducts.map((product) => (
          <article key={product.id}>
            <h3>{product.name}</h3>
            {product.productStory && <p>{product.productStory}</p>}
            {product.processDescription && <p>{product.processDescription}</p>}
          </article>
        ))}
        {craftSite && <Link to={`${villageMapPath(village.slug)}?site=${craftSite.id}`}>Khám phá khu làng nghề →</Link>}
      </div>
    </section>
  );
}

export function VillageVideos({ village }: { village: VillageDetails }) {
  const videos = village.videos.flatMap((video) => {
    const embedUrl = youtubeEmbedUrl(video.url);
    return embedUrl ? [{ ...video, embedUrl }] : [];
  });
  if (videos.length === 0) return null;

  return (
    <section className="village-section" aria-labelledby="village-video-title">
      <Reveal className="village-section__heading">
        <span>Tư liệu nghe nhìn</span>
        <h2 id="village-video-title">Video lịch sử và văn hóa làng</h2>
      </Reveal>
      <div className="village-videos">
        {videos.map((video, index) => (
          <Reveal as="article" className="village-video" index={index} key={video.id}>
            <iframe
              src={video.embedUrl}
              title={video.caption ?? `Video tư liệu ${village.name}`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div>
              <h3>{video.caption ?? `Video tư liệu ${village.name}`}</h3>
              <a href={video.url} target="_blank" rel="noreferrer">Mở video trên YouTube ↗</a>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function youtubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['www.youtube.com', 'youtube.com'].includes(url.hostname)) return null;
    const videoId = url.searchParams.get('v');
    return videoId && /^[A-Za-z0-9_-]+$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function TextParagraphs({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) paragraphs.push(sentences.slice(index, index + 3).join(' '));
  return <>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>;
}

export function VillageGallery({ village }: { village: VillageDetails }) {
  if (village.gallery.length === 0) return null;
  return (
    <section className="village-section" aria-labelledby="village-gallery-title">
      <Reveal className="village-section__heading">
        <h2 id="village-gallery-title">Thư viện hình ảnh</h2>
      </Reveal>
      <div className="village-gallery">
        {village.gallery.slice(0, 6).map((image, index) => (
          <Reveal
            as="figure"
            index={index}
            key={image.url}
            className={index === 0 ? 'village-gallery__item village-gallery__item--feature' : 'village-gallery__item'}
          >
            <SafeImage src={image.url} alt={image.alt} className="village-gallery__image" />
            <figcaption>{image.alt}</figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function VillageMapSection({ village }: { village: VillageDetails }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { openPanorama } = usePanorama();
  if (village.sites.length === 0) return null;

  return (
    <section className="village-section village-location" aria-labelledby="village-location-title">
      <div className="village-location__copy">
        <h2 id="village-location-title">{village.name} trên bản đồ</h2>
        {village.adminLocation && <p>{village.adminLocation}</p>}
        <Link className="village-button village-button--primary" to={villageMapPath(village.slug)}>Mở bản đồ di sản</Link>
      </div>
      <div className="village-location__map" aria-label={`Bản đồ ${village.name}`}>
        <TourMap sites={village.sites} selectedId={selectedId} onSelect={setSelectedId} onOpenPanorama={openPanorama} />
      </div>
    </section>
  );
}

export function VillageCallToAction({
  villageName,
  villageSlug,
  hasPanorama,
}: {
  villageName: string;
  villageSlug: string;
  hasPanorama: boolean;
}) {
  return (
    <section className="village-cta" aria-labelledby="village-cta-title">
      <p>Hành trình di sản</p>
      <h2 id="village-cta-title">Bắt đầu khám phá không gian {villageName}</h2>
      <div>
        <Link className="village-button village-button--gold" to={villageMapPath(villageSlug)}>Khám phá bản đồ di sản</Link>
        {hasPanorama && <Link className="village-button village-button--light" to={villagePanoramaPath(villageSlug)}>Trải nghiệm 360°</Link>}
      </div>
    </section>
  );
}
