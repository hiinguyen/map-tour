import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminKeyGate } from '../components/AdminKeyGate';
import { AdminNav } from '../components/AdminNav';
import { commitKmlImport, parseKmlFile } from '../lib/adminApi';
import type { KmlCommitSummary, ParsedKmlImport } from '../lib/kmlTypes';
import { fetchVillages } from '../lib/api';
import type { Village } from '../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định';
}

export function AdminKmlImportPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedKmlImport | null>(null);
  const [summary, setSummary] = useState<KmlCommitSummary | null>(null);
  const [overwriteAdmin, setOverwriteAdmin] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVillages()
      .then((data: Village[]) => {
        setVillages(data);
        if (data.length > 0) setSelectedVillageId(data[0].id);
      })
      .catch((err: unknown) => setError(getErrorMessage(err)));
  }, []);


  async function handleParse(event: FormEvent) {
    event.preventDefault();
    if (!file || !selectedVillageId) return;
    setIsParsing(true);
    setError(null);
    setSummary(null);
    try {
      const result = await parseKmlFile(file, selectedVillageId);
      setParsed(result);
    } catch (err) {
      setError(getErrorMessage(err));
      setParsed(null);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleCommit() {
    if (!parsed) return;
    setIsCommitting(true);
    setError(null);
    try {
      const result = await commitKmlImport(parsed, { overwriteAdminEdits: overwriteAdmin });
      setSummary(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCommitting(false);
    }
  }

  function updateAmbiguousSelection(index: number, siteId: string) {
    if (!parsed) return;
    const ambiguous = parsed.ambiguous.map((item, i) =>
      i === index ? { ...item, selectedSiteId: siteId || null } : item,
    );
    setParsed({ ...parsed, ambiguous });
  }

  function updateUnmatchedCreate(index: number, createNewSite: boolean) {
    if (!parsed) return;
    const unmatched = parsed.unmatched.map((item, i) =>
      i === index ? { ...item, createNewSite } : item,
    );
    setParsed({ ...parsed, unmatched });
  }

  function updateUnmatchedName(index: number, newSiteName: string) {
    if (!parsed) return;
    const unmatched = parsed.unmatched.map((item, i) =>
      i === index ? { ...item, newSiteName } : item,
    );
    setParsed({ ...parsed, unmatched });
  }

  function updateUnmatchedCategory(index: number, newSiteCategory: string) {
    if (!parsed) return;
    const unmatched = parsed.unmatched.map((item, i) =>
      i === index ? { ...item, newSiteCategory } : item,
    );
    setParsed({ ...parsed, unmatched });
  }

  // R13: một dòng nhập nhằng chỉ được ghi khi người dùng chọn tay địa danh.
  const unselectedAmbiguousCount = parsed
    ? parsed.ambiguous.filter((item) => !item.selectedSiteId).length
    : 0;

  return (
    <AdminKeyGate title="Nhập ranh giới từ KML/KMZ">
      <div className="admin-import">
        <header className="admin-import__header">
          <h1>Nhập ranh giới từ KML/KMZ</h1>
          <p>
            Tải lên file bản đồ (.kml hoặc .kmz) xuất từ Google My Maps để nhập ranh giới khuôn viên cho các địa danh của làng.
          </p>
          <AdminNav current="/admin/kml" />
        </header>

        <form className="admin-import__upload-form" onSubmit={handleParse}>
          <label>
            Chọn làng:{' '}
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              disabled={isParsing}
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <input
            type="file"
            accept=".kml,.kmz"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={!file || !selectedVillageId || isParsing}>
            {isParsing ? 'Đang phân tích...' : 'Phân tích file KML'}
          </button>
        </form>

        {error && <p className="admin-import__status admin-import__status--error">{error}</p>}

        {parsed && (
          <div className="admin-import__preview">
            <h2>Kết quả xem trước: {parsed.fileName} ({parsed.villageName})</h2>

            <div className="admin-import__stats">
              <p>Tổng đa giác: <strong>{parsed.counts.totalPolygons}</strong></p>
              <p>Khớp tự tin: <strong>{parsed.counts.matchedCount}</strong></p>
              <p>Khớp yếu: <strong>{parsed.counts.ambiguousCount}</strong></p>
              <p>Chưa khớp: <strong>{parsed.counts.unmatchedCount}</strong></p>
              <p>Không hỗ trợ: <strong>{parsed.counts.unsupportedCount}</strong></p>
              <p>Từ chối: <strong>{parsed.counts.rejectedCount}</strong></p>
              <p>Đường làng (LineString): {parsed.counts.lineStringCount}</p>
              <p>Ghim điểm (Point): {parsed.counts.pointCount}</p>
            </div>

            {parsed.matched.length > 0 && (
              <section className="admin-import__section">
                <h3>Địa danh khớp tự tin ({parsed.matched.length})</h3>
                {parsed.matched.map((m) => (
                  <article key={m.siteId} className="admin-import__card">
                    <h4>{m.placemarkName} -&gt; {m.siteName}</h4>
                    <p>Điểm tự tin: {m.score} | Diện tích: {Math.round(m.areaM2).toLocaleString('vi-VN')} m² | Số đỉnh: {m.ring.length}</p>
                    {m.protected && <p className="admin-import__warning">Bản ghi này có ranh giới sửa tay (admin) - sẽ được bảo vệ.</p>}
                  </article>
                ))}
              </section>
            )}

            {parsed.ambiguous.length > 0 && (
              <section className="admin-import__section">
                <h3>Địa danh khớp yếu cần xác nhận ({parsed.ambiguous.length})</h3>
                {parsed.ambiguous.map((item, index) => (
                  <article key={`${item.placemarkName}-${index}`} className="admin-import__card">
                    <h4>{item.placemarkName} (Diện tích: {Math.round(item.areaM2).toLocaleString('vi-VN')} m²)</h4>
                    <label>
                      Chọn địa danh ghép:{' '}
                      <select
                        value={item.selectedSiteId || ''}
                        onChange={(e) => updateAmbiguousSelection(index, e.target.value)}
                      >
                        <option value="">(Bỏ qua - Không gán)</option>
                        {item.candidates.map((c) => (
                          <option key={c.siteId} value={c.siteId}>
                            {c.siteName} (điểm: {c.score})
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
              </section>
            )}

            {parsed.unmatched.length > 0 && (
              <section className="admin-import__section">
                <h3>Đa giác chưa khớp ({parsed.unmatched.length})</h3>
                {parsed.unmatched.map((item, index) => (
                  <article key={`${item.placemarkName}-${index}`} className="admin-import__card">
                    <h4>{item.placemarkName} (Folder: {item.folderName || 'Gốc'}, Diện tích: {Math.round(item.areaM2).toLocaleString('vi-VN')} m²)</h4>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!item.createNewSite}
                        onChange={(e) => updateUnmatchedCreate(index, e.target.checked)}
                      />
                      Tạo địa danh mới từ đa giác này
                    </label>
                    {item.createNewSite && (
                      <div className="admin-import__fields">
                        <label>
                          Tên địa danh mới:{' '}
                          <input
                            type="text"
                            value={item.newSiteName ?? item.placemarkName}
                            onChange={(e) => updateUnmatchedName(index, e.target.value)}
                          />
                        </label>
                        <label>
                          Loại hình:{' '}
                          <input
                            type="text"
                            value={item.newSiteCategory ?? item.suggestedCategory}
                            onChange={(e) => updateUnmatchedCategory(index, e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            )}

            {parsed.sitesWithoutBoundary.length > 0 && (
              <section className="admin-import__section">
                <h3>Địa danh trong làng chưa có ranh giới KML ({parsed.sitesWithoutBoundary.length})</h3>
                <ul>
                  {parsed.sitesWithoutBoundary.map((s) => (
                    <li key={s.id}>{s.name} ({s.category})</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="admin-import__options">
              <label>
                <input
                  type="checkbox"
                  checked={overwriteAdmin}
                  onChange={(e) => setOverwriteAdmin(e.target.checked)}
                />
                Ghi đè cả các bản ghi đã sửa ranh giới bằng tay (boundary_source = admin)
              </label>
            </div>

            {unselectedAmbiguousCount > 0 && (
              <p className="admin-import__status admin-import__status--error">
                Còn {unselectedAmbiguousCount} dòng nhập nhằng chưa chọn địa danh. Phải chọn đủ từng dòng trước khi nhập.
              </p>
            )}

            <button
              type="button"
              className="admin-import__commit-btn"
              onClick={handleCommit}
              disabled={isCommitting || unselectedAmbiguousCount > 0}
            >
              {isCommitting ? 'Đang nhập KML...' : 'Xác nhận nhập ranh giới KML'}
            </button>
          </div>
        )}

        {summary && (
          <div className="admin-import__summary">
            <h2>Kết quả nhập ranh giới KML</h2>
            <ul>
              <li>Số địa danh cập nhật ranh giới: {summary.updatedCount}</li>
              <li>Số địa danh tạo mới: {summary.createdCount}</li>
              <li>Số địa danh giữ nguyên (bảo vệ sửa tay admin): {summary.protectedCount}</li>
              {summary.skippedUnselectedCount ? (
                <li>Số dòng nhập nhằng bị bỏ qua do chưa chọn: {summary.skippedUnselectedCount}</li>
              ) : null}
              <li>Tổng số bản ghi đã xử lý: {summary.totalProcessed}</li>
            </ul>
          </div>
        )}
      </div>
    </AdminKeyGate>
  );
}
