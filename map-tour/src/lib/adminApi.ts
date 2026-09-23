import type { ImportCommitSummary, ParsedImport } from './importTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const ADMIN_KEY_STORAGE_KEY = 'map-tour-admin-key';

export function getAdminKey(): string {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE_KEY) ?? '';
}

export function setAdminKey(key: string): void {
  sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, key);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Lỗi HTTP ${response.status}`;
  } catch {
    return `Lỗi HTTP ${response.status}`;
  }
}

export async function parseImportFile(file: File): Promise<ParsedImport> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/admin/import/parse`, {
    method: 'POST',
    headers: { 'x-admin-key': getAdminKey() },
    body: formData,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function commitImport(parsed: ParsedImport): Promise<ImportCommitSummary> {
  const response = await fetch(`${API_BASE_URL}/admin/import/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify(parsed),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function parseKmlFile(file: File, villageId: string): Promise<import('./kmlTypes').ParsedKmlImport> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('villageId', villageId);
  const response = await fetch(`${API_BASE_URL}/admin/import/kml/parse`, {
    method: 'POST',
    headers: { 'x-admin-key': getAdminKey() },
    body: formData,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function commitKmlImport(
  data: import('./kmlTypes').ParsedKmlImport,
  options?: import('./kmlTypes').KmlCommitOptions,
): Promise<import('./kmlTypes').KmlCommitSummary> {
  const response = await fetch(`${API_BASE_URL}/admin/import/kml/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify({ data, options }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}


export interface VillageBasicInfoInput {
  name: string;
  aliases: string[];
  adminLocation: string | null;
  googleMapsLink: string | null;
  foundedPeriod: string | null;
  brandIdentity: string | null;
  nameMeaning: string | null;
  mainOccupations: string[];
  naturalFeatures: string | null;
  siteSelectionHistory: string | null;
  morphologyDescription: string | null;
}

export interface VillageBasicInfoResult {
  id: string;
  slug: string;
  name: string;
}

export async function updateVillageBasicInfo(
  villageId: string,
  input: VillageBasicInfoInput,
): Promise<VillageBasicInfoResult> {
  const response = await fetch(`${API_BASE_URL}/admin/villages/${villageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function uploadVillageCoverImage(villageId: string, file: File): Promise<{ coverUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/admin/villages/${villageId}/cover-image`, {
    method: 'POST',
    headers: { 'x-admin-key': getAdminKey() },
    body: formData,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function removeVillageCoverImage(villageId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/villages/${villageId}/cover-image`, {
    method: 'DELETE',
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
}

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export interface AdminSite {
  id: string;
  kind: 'point' | 'area';
  name: string;
  category: string;
  subCategory: string | null;
  shortDescription: string | null;
  lightCount25m: number | null;
  historyCultureNote: string | null;
  positionLat: number | null;
  positionLng: number | null;
  boundaryPointCount: number;
  rawBoundary?: string | null;
  coverUrl: string | null;
  panoramaUrl: string | null;
}

export interface AdminSiteInput {
  name: string;
  category: string;
  subCategory: string | null;
  shortDescription: string | null;
  lightCount25m: number | null;
  historyCultureNote: string | null;
  positionLat: number | null;
  positionLng: number | null;
  boundaryInput?: string | null;
}

export interface BoundaryPreviewResult {
  ring: [number, number][];
  vertexCount: number;
  areaM2: number;
  centroid: [number, number] | null;
  detectedFormat: string;
  warnings: string[];
  errors: string[];
}

export async function fetchAdminSites(villageId: string): Promise<AdminSite[]> {
  const response = await fetch(`${API_BASE_URL}/admin/villages/${villageId}/sites`, {
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function updateAdminSite(siteId: string, input: AdminSiteInput): Promise<{
  id: string;
  name: string;
  kind?: 'point' | 'area';
  detectedFormat?: string;
  vertexCount?: number;
  areaM2?: number;
  warnings?: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/admin/sites/${siteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function previewSiteBoundary(siteId: string, boundaryInput: string): Promise<BoundaryPreviewResult> {
  const response = await fetch(`${API_BASE_URL}/admin/sites/${siteId}/boundary/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify({ boundaryInput }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function deleteSiteBoundary(siteId: string): Promise<{ id: string; kind: 'point' }> {
  const response = await fetch(`${API_BASE_URL}/admin/sites/${siteId}/boundary`, {
    method: 'DELETE',
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function uploadSiteCoverImage(siteId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/admin/sites/${siteId}/cover-image`, {
    method: 'POST',
    headers: { 'x-admin-key': getAdminKey() },
    body: formData,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function removeSiteCoverImage(siteId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/sites/${siteId}/cover-image`, {
    method: 'DELETE',
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
}

export async function uploadSitePanoramaImage(siteId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/admin/sites/${siteId}/panorama-image`, {
    method: 'POST',
    headers: { 'x-admin-key': getAdminKey() },
    body: formData,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function removeSitePanoramaImage(siteId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/sites/${siteId}/panorama-image`, {
    method: 'DELETE',
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
}

// ---------------------------------------------------------------------------
// Heritage buildings
// ---------------------------------------------------------------------------

export interface AdminHeritageBuildingTechnicalDetails {
  roofLayers: string | null;
  roofShape: string | null;
  roofMaterial: string | null;
  roofColor: string | null;
  facadeMaterial: string | null;
  facadeCondition: string | null;
  floorMaterial: string | null;
  floorPattern: string | null;
  structureMaterial: string | null;
  structureCondition: string | null;
  columnHeightCm: number | null;
  columnDiameterCm: number | null;
  pedestalMaterial: string | null;
  pedestalSize: string | null;
  pedestalType: string | null;
}

export interface AdminHeritageBuildingPhoto {
  id: string;
  url: string;
  kind: 'anh' | 'panorama';
  caption: string | null;
  attribution: string | null;
}

export interface AdminHeritageBuilding {
  id: string;
  name: string;
  address: string | null;
  function: string | null;
  ownership: string | null;
  landAreaM2: number | null;
  floorAreaM2: number | null;
  heritageRank: string | null;
  heritageRankYear: number | null;
  heritageStyleType: string | null;
  managingUnit: string | null;
  overallStructureDescription: string | null;
  culturalHistoricalValue: string | null;
  builtPeriod: string | null;
  restorationNote: string | null;
  technicalDetails: AdminHeritageBuildingTechnicalDetails;
  photos: AdminHeritageBuildingPhoto[];
}

export interface AdminHeritageBuildingInput {
  name: string;
  address: string | null;
  function: string | null;
  ownership: string | null;
  landAreaM2: number | null;
  floorAreaM2: number | null;
  heritageRank: string | null;
  heritageRankYear: number | null;
  heritageStyleType: string | null;
  managingUnit: string | null;
  overallStructureDescription: string | null;
  culturalHistoricalValue: string | null;
  builtPeriod: string | null;
  restorationNote: string | null;
  technicalDetails: AdminHeritageBuildingTechnicalDetails;
}

export async function fetchAdminHeritageBuildings(villageId: string): Promise<AdminHeritageBuilding[]> {
  const response = await fetch(`${API_BASE_URL}/admin/villages/${villageId}/heritage-buildings`, {
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function updateAdminHeritageBuilding(
  buildingId: string,
  input: AdminHeritageBuildingInput,
): Promise<{ id: string; name: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/heritage-buildings/${buildingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function uploadHeritageBuildingPhoto(
  buildingId: string,
  file: File,
  kind: 'anh' | 'panorama',
): Promise<AdminHeritageBuildingPhoto> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);
  const response = await fetch(`${API_BASE_URL}/admin/heritage-buildings/${buildingId}/photos`, {
    method: 'POST',
    headers: { 'x-admin-key': getAdminKey() },
    body: formData,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export interface AdminMediaItem {
  id: string;
  url: string;
  caption: string | null;
  attribution: string | null;
}

export async function updateMediaItem(
  mediaId: string,
  input: { url: string; caption: string | null; attribution: string | null },
): Promise<AdminMediaItem> {
  const response = await fetch(`${API_BASE_URL}/admin/media/${mediaId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function deleteMediaItem(mediaId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/media/${mediaId}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
}

// ---------------------------------------------------------------------------
// Generic schema-driven entities
// ---------------------------------------------------------------------------

export type GenericFieldType = 'text' | 'textarea' | 'boolean' | 'select' | 'string[]';

export interface GenericFieldOption {
  value: string;
  label: string;
}

export interface GenericFieldConfig {
  name: string;
  column: string;
  label: string;
  type: GenericFieldType;
  required?: boolean;
  options?: GenericFieldOption[];
}

export interface GenericContextField {
  name: string;
  label: string;
}

export interface GenericEntityMeta {
  key: string;
  label: string;
  fields: GenericFieldConfig[];
  context: GenericContextField[];
}

export interface GenericRow {
  id: string;
  title: string;
  subtitle: string | null;
  fields: Record<string, string | boolean | string[] | null>;
  context: Record<string, string | null>;
}

export async function fetchGenericEntities(): Promise<GenericEntityMeta[]> {
  const response = await fetch(`${API_BASE_URL}/admin/generic-entities`, {
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function fetchGenericRows(entityKey: string, search?: string): Promise<GenericRow[]> {
  const query = search ? `?q=${encodeURIComponent(search)}` : '';
  const response = await fetch(`${API_BASE_URL}/admin/generic/${entityKey}${query}`, {
    headers: { 'x-admin-key': getAdminKey() },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

export async function updateGenericRow(
  entityKey: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<GenericRow> {
  const response = await fetch(`${API_BASE_URL}/admin/generic/${entityKey}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}
