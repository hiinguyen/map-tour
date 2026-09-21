// Relative to the active `/lang/:villageSlug` layout route — resolved by
// react-router against whatever village is currently in context.
export const APP_ROUTES = {
  home: '.',
  villageIntroduction: 'gioi-thieu',
  map: 'map',
  heritage: 'di-san',
  architecture: 'kien-truc',
  panorama: '360',
} as const;

function villagePath(villageSlug: string, childPath?: string) {
  const root = `/lang/${encodeURIComponent(villageSlug)}`;
  return childPath ? `${root}/${childPath}` : root;
}

export const villageHomePath = (villageSlug: string) => villagePath(villageSlug);
export const villageIntroductionPath = (villageSlug: string) =>
  villagePath(villageSlug, APP_ROUTES.villageIntroduction);
export const villageMapPath = (villageSlug: string) => villagePath(villageSlug, APP_ROUTES.map);
export const villageHeritagePath = (villageSlug: string) => villagePath(villageSlug, APP_ROUTES.heritage);
export const villageLandmarkPath = (villageSlug: string, landmarkId: string) =>
  villagePath(villageSlug, `${APP_ROUTES.heritage}/${encodeURIComponent(landmarkId)}`);
export const villageArchitecturePath = (villageSlug: string) => villagePath(villageSlug, APP_ROUTES.architecture);
export const villagePanoramaPath = (villageSlug: string) => villagePath(villageSlug, APP_ROUTES.panorama);
