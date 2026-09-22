import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  TraditionalCraft,
  VillageArchitecture,
  VillageCallToAction,
  VillageCulturalStories,
  VillageCulture,
  VillageGallery,
  VillageHero,
  VillageHistory,
  VillageLandscape,
  VillageMapSection,
  VillageNameMeaning,
  VillageOverview,
  VillageQuickFacts,
  VillageVideos,
} from '../components/VillageIntroductionSections';
import { Reveal } from '../components/Reveal';
import { fetchVillageDetails } from '../lib/api';
import { villageHomePath } from '../routes';
import type { VillageDetails } from '../types';

export function VillageIntroductionPage() {
  const { villageSlug } = useParams<{ villageSlug: string }>();
  const [village, setVillage] = useState<VillageDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  const retry = useCallback(() => setRequestKey((key) => key + 1), []);

  useEffect(() => {
    if (!villageSlug) return;
    const controller = new AbortController();
    setError(null);
    fetchVillageDetails(villageSlug, controller.signal)
      .then(setVillage)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Không tải được thông tin làng.');
        }
      });
    return () => controller.abort();
  }, [villageSlug, requestKey]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = village ? `${village.name} — Di sản làng nghề` : 'Giới thiệu làng nghề';
    const existingDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const description = existingDescription ?? document.createElement('meta');
    const previousDescription = existingDescription?.content;
    if (!existingDescription) {
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = village
      ? [village.name, village.adminLocation, village.mainOccupations.join(', ')].filter(Boolean).join(' — ')
      : 'Hồ sơ số hóa làng nghề.';
    return () => {
      document.title = previousTitle;
      if (existingDescription) description.content = previousDescription ?? '';
      else description.remove();
    };
  }, [village]);

  if (!village && !error) return <VillagePageLoading />;
  if (!village && error) {
    return (
      <div className="village-state" role="alert">
        <span>Không thể mở hồ sơ làng</span>
        <h1>Thông tin đang tạm gián đoạn</h1>
        <p>{error}</p>
        <div>
          <button type="button" onClick={retry}>Thử lại</button>
          <Link to={villageSlug ? villageHomePath(villageSlug) : '/'}>Quay về trang chủ</Link>
        </div>
      </div>
    );
  }
  if (!village) return null;

  return (
    <article className="village-page">
      <nav className="village-breadcrumb" aria-label="Đường dẫn trang">
        <Link to={villageHomePath(village.slug)}>Trang chủ</Link><span aria-hidden="true">/</span><span>Giới thiệu {village.name}</span>
      </nav>
      {/* The hero is above the fold on every viewport, so it keeps its own
          entry animation; everything below it is released by the scroll
          observer as the reader reaches it.

          Sections built from a repeating grid (history, stories, architecture,
          landmarks, gallery, videos) reveal their own heading and then stagger
          their items, so they are NOT wrapped again here - a reveal inside a
          reveal plays both transforms at once and reads as a wobble. */}
      <VillageHero village={village} />
      <VillageQuickFacts village={village} />
      <Reveal><VillageOverview village={village} /></Reveal>
      <Reveal><VillageNameMeaning village={village} /></Reveal>
      <VillageHistory village={village} />
      <Reveal><TraditionalCraft village={village} /></Reveal>
      <VillageCulturalStories village={village} />
      <Reveal><VillageLandscape village={village} /></Reveal>
      <VillageArchitecture village={village} />
      <VillageCulture sites={village.sites} villageSlug={village.slug} />
      <VillageGallery village={village} />
      <VillageVideos village={village} />
      <Reveal><VillageMapSection village={village} /></Reveal>
      <Reveal>
        <VillageCallToAction
          villageName={village.name}
          villageSlug={village.slug}
          hasPanorama={village.statistics.panoramaCount > 0}
        />
      </Reveal>
      <footer className="village-page__footer">Dữ liệu giới thiệu được tổng hợp từ hồ sơ số hóa của {village.name}.</footer>
    </article>
  );
}

function VillagePageLoading() {
  return (
    <div className="village-page village-page--loading" aria-busy="true" aria-label="Đang tải thông tin làng">
      <div className="village-skeleton village-skeleton--hero" />
      <div className="village-skeleton-row">
        <div className="village-skeleton" /><div className="village-skeleton" /><div className="village-skeleton" />
      </div>
      <p role="status">Đang mở hồ sơ làng...</p>
    </div>
  );
}
