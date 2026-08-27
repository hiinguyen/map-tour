import { useState } from 'react';
import type { FormEvent } from 'react';
import { AdminKeyGate } from '../components/AdminKeyGate';
import { AdminNav } from '../components/AdminNav';
import { commitImport, parseImportFile } from '../lib/adminApi';
import type { ImportCommitSummary, ParsedImport } from '../lib/importTypes';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định';
}

export function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [summary, setSummary] = useState<ImportCommitSummary | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setIsParsing(true);
    setError(null);
    setSummary(null);
    try {
      const result = await parseImportFile(file);
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
      const result = await commitImport(parsed);
      setSummary(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCommitting(false);
    }
  }

  function updateDecorativeBuilding(index: number, buildingTempId: string) {
    if (!parsed) return;
    const decorativeArtItems = parsed.decorativeArtItems.map((item, i) =>
      i === index ? { ...item, buildingTempId } : item,
    );
    setParsed({ ...parsed, decorativeArtItems });
  }

  return (
    <AdminKeyGate title="Nhập dữ liệu từ Excel">
    <div className="admin-import">
      <header className="admin-import__header">
        <h1>Nhập dữ liệu từ Excel</h1>
        <p>
          Tải lên file khảo sát làng (.xlsx) để nhập thông tin làng, công trình di sản, lịch sử, mỹ thuật trang trí,
          di sản phi vật thể và sản phẩm nghề vào CSDL. Bản đồ tổng thể (sheet 2) và điều tra xã hội học (sheet 8)
          không được nhập tự động — xem cảnh báo bên dưới.
        </p>
        <AdminNav current="/admin/import" />
      </header>

      <form className="admin-import__upload-form" onSubmit={handleParse}>
        <input
          type="file"
          accept=".xlsx"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={!file || isParsing}>
          {isParsing ? 'Đang phân tích...' : 'Phân tích file'}
        </button>
      </form>

      {error && <p className="admin-import__status admin-import__status--error">{error}</p>}

      {parsed && (
        <div className="admin-import__preview">
          <h2>Xem trước dữ liệu — {parsed.sourceFileName}</h2>

          {parsed.warnings.length > 0 && (
            <ul className="admin-import__warnings">
              {parsed.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}

          <section className="admin-import__section">
            <h3>Làng</h3>
            {parsed.village ? (
              <dl className="admin-import__fields">
                <dt>Tên</dt>
                <dd>{parsed.village.name}</dd>
                {parsed.village.adminLocation && (
                  <>
                    <dt>Hành chính</dt>
                    <dd>{parsed.village.adminLocation}</dd>
                  </>
                )}
                {parsed.village.foundedPeriod && (
                  <>
                    <dt>Thời điểm hình thành</dt>
                    <dd>{parsed.village.foundedPeriod}</dd>
                  </>
                )}
              </dl>
            ) : (
              <p className="admin-import__empty">Không tìm thấy thông tin làng trong file này.</p>
            )}
          </section>

          <section className="admin-import__section">
            <h3>Công trình di sản ({parsed.heritageBuildings.length})</h3>
            {parsed.heritageBuildings.map((building) => (
              <article key={building.tempId} className="admin-import__card">
                <h4>{building.name}</h4>
                <p>{building.function ?? '—'}</p>
                <p>{building.overallStructureDescription ?? ''}</p>
              </article>
            ))}
          </section>

          <section className="admin-import__section">
            <h3>Lịch sử &amp; văn hóa ({parsed.historyStories.length})</h3>
            {parsed.historyStories.map((story) => (
              <article key={story.title} className="admin-import__card">
                <h4>{story.title}</h4>
                <p>{story.bodyText}</p>
              </article>
            ))}
          </section>

          <section className="admin-import__section">
            <h3>Mỹ thuật trang trí &amp; hiện vật ({parsed.decorativeArtItems.length})</h3>
            {parsed.decorativeArtItems.map((item, index) => (
              <article key={`${item.subjectName}-${index}`} className="admin-import__card">
                <h4>{item.subjectName}</h4>
                <label>
                  Gán vào công trình:{' '}
                  <select
                    value={item.buildingTempId}
                    onChange={(event) => updateDecorativeBuilding(index, event.target.value)}
                  >
                    {parsed.heritageBuildings.map((building) => (
                      <option key={building.tempId} value={building.tempId}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p>{item.description}</p>
              </article>
            ))}
          </section>

          <section className="admin-import__section">
            <h3>Di sản văn hóa phi vật thể ({parsed.intangibleHeritageItems.length})</h3>
            {parsed.intangibleHeritageItems.map((item) => (
              <article key={item.name} className="admin-import__card">
                <h4>{item.name}</h4>
                {item.uniquenessDescription && <p>{item.uniquenessDescription}</p>}
              </article>
            ))}
          </section>

          <section className="admin-import__section">
            <h3>Sản phẩm nghề truyền thống ({parsed.craftProducts.length})</h3>
            {parsed.craftProducts.map((product) => (
              <article key={product.name} className="admin-import__card">
                <h4>{product.name}</h4>
                <p>{product.productStory ?? product.processDescription ?? ''}</p>
              </article>
            ))}
          </section>

          <button type="button" className="admin-import__commit-btn" onClick={handleCommit} disabled={isCommitting}>
            {isCommitting ? 'Đang nhập...' : 'Xác nhận nhập dữ liệu'}
          </button>
        </div>
      )}

      {summary && (
        <div className="admin-import__summary">
          <h2>Kết quả nhập dữ liệu</h2>
          <ul>
            <li>Làng: {summary.villageAction === 'created' ? 'đã tạo mới' : summary.villageAction === 'updated' ? 'đã cập nhật' : 'bỏ qua'}</li>
            <li>Công trình di sản: {summary.heritageBuildingCount}</li>
            <li>Lịch sử &amp; văn hóa: {summary.historyStoryCount}</li>
            <li>Mỹ thuật trang trí: {summary.decorativeArtItemCount}</li>
            <li>Di sản phi vật thể: {summary.intangibleHeritageItemCount}</li>
            <li>Sản phẩm nghề: {summary.craftProductCount}</li>
          </ul>
          {summary.warnings.length > 0 && (
            <ul className="admin-import__warnings">
              {summary.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
    </AdminKeyGate>
  );
}
