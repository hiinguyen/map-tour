import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { VillageLayout } from './components/VillageLayout';
import { VillagesPortalPage } from './pages/VillagesPortalPage';
import { HomePage } from './pages/HomePage';
import { HeritageListPage } from './pages/HeritageListPage';
import { APP_ROUTES } from './routes';

const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));
const Experience3DPage = lazy(() =>
  import('./pages/Experience3DPage').then((m) => ({ default: m.Experience3DPage })),
);
const AdminImportPage = lazy(() =>
  import('./pages/AdminImportPage').then((m) => ({ default: m.AdminImportPage })),
);
const VillageEditPage = lazy(() =>
  import('./pages/VillageEditPage').then((m) => ({ default: m.VillageEditPage })),
);
const AdminSitesPage = lazy(() =>
  import('./pages/AdminSitesPage').then((m) => ({ default: m.AdminSitesPage })),
);
const AdminHeritageBuildingsPage = lazy(() =>
  import('./pages/AdminHeritageBuildingsPage').then((m) => ({ default: m.AdminHeritageBuildingsPage })),
);
const AdminGenericPage = lazy(() =>
  import('./pages/AdminGenericPage').then((m) => ({ default: m.AdminGenericPage })),
);
const VillageIntroductionPage = lazy(() =>
  import('./pages/VillageIntroductionPage').then((m) => ({ default: m.VillageIntroductionPage })),
);
const LandmarkDetailPage = lazy(() =>
  import('./pages/LandmarkDetailPage').then((m) => ({ default: m.LandmarkDetailPage })),
);
const ArchitectureHighlightsPage = lazy(() =>
  import('./pages/ArchitectureHighlightsPage').then((m) => ({ default: m.ArchitectureHighlightsPage })),
);

export function App() {
  return (
    <div className="app">
      {/* Paper tooth over the whole document: fixed and non-interactive so the
          texture composites once instead of repainting as the page scrolls. */}
      <div className="motif-grain" aria-hidden="true" />
      <Suspense fallback={<p className="app__route-loading">Đang tải...</p>}>
        <Routes>
          <Route path="/" element={<VillagesPortalPage />} />
          <Route path="/lang/:villageSlug" element={<VillageLayout />}>
            <Route index element={<HomePage />} />
            <Route path={APP_ROUTES.villageIntroduction} element={<VillageIntroductionPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="di-san" element={<HeritageListPage />} />
            <Route path="di-san/:landmarkId" element={<LandmarkDetailPage />} />
            <Route path={APP_ROUTES.architecture} element={<ArchitectureHighlightsPage />} />
            <Route path="360" element={<Experience3DPage />} />
          </Route>
          <Route path="/admin/import" element={<AdminImportPage />} />
          <Route path="/admin/villages" element={<VillageEditPage />} />
          <Route path="/admin/sites" element={<AdminSitesPage />} />
          <Route path="/admin/heritage-buildings" element={<AdminHeritageBuildingsPage />} />
          <Route path="/admin/data" element={<AdminGenericPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}
