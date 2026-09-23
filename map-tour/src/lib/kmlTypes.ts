export type LatLng = [number, number];

export interface MatchedKmlItem {
  siteId: string;
  siteName: string;
  placemarkName: string;
  confidence: 'confident';
  score: number;
  ring: LatLng[];
  areaM2: number;
  centroid: LatLng;
  landAreaM2?: number | null;
  warnings: string[];
  protected: boolean;
}

export interface AmbiguousCandidate {
  siteId: string;
  siteName: string;
  score: number;
}

export interface AmbiguousKmlItem {
  placemarkName: string;
  confidence: 'weak';
  score: number;
  candidates: AmbiguousCandidate[];
  selectedSiteId?: string | null;
  ring: LatLng[];
  areaM2: number;
  centroid: LatLng;
  landAreaM2?: number | null;
  warnings: string[];
  protected: boolean;
}

export interface UnmatchedKmlItem {
  placemarkName: string;
  folderName: string;
  suggestedCategory: string;
  ring: LatLng[];
  areaM2: number;
  centroid: LatLng;
  warnings: string[];
  createNewSite?: boolean;
  newSiteName?: string;
  newSiteCategory?: string;
}

export interface UnsupportedKmlItem {
  placemarkName: string;
  folderName: string;
  reason: string;
}

export interface RejectedKmlItem {
  placemarkName: string;
  folderName: string;
  errors: string[];
}

export interface SiteWithoutBoundary {
  id: string;
  name: string;
  category: string;
}

export interface ParsedKmlImport {
  villageId: string;
  villageName: string;
  fileName: string;
  matched: MatchedKmlItem[];
  ambiguous: AmbiguousKmlItem[];
  unmatched: UnmatchedKmlItem[];
  unsupported: UnsupportedKmlItem[];
  rejected: RejectedKmlItem[];
  sitesWithoutBoundary: SiteWithoutBoundary[];
  counts: {
    totalPolygons: number;
    matchedCount: number;
    ambiguousCount: number;
    unmatchedCount: number;
    unsupportedCount: number;
    rejectedCount: number;
    lineStringCount: number;
    pointCount: number;
  };
}

export interface KmlCommitOptions {
  overwriteAdminEdits?: boolean;
}

export interface KmlCommitSummary {
  updatedCount: number;
  createdCount: number;
  protectedCount: number;
  /** Số dòng nhập nhằng bị bỏ qua vì chưa chọn địa danh (R13). */
  skippedUnselectedCount?: number;
  totalProcessed: number;
}
