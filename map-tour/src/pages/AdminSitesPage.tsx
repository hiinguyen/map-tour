import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AdminKeyGate } from '../components/AdminKeyGate';
import { AdminNav } from '../components/AdminNav';
import { SafeImage } from '../components/SafeImage';
import { fetchVillages } from '../lib/api';
import {
  deleteSiteBoundary,
  fetchAdminSites,
  previewSiteBoundary,
  removeSiteCoverImage,
  removeSitePanoramaImage,
  updateAdminSite,
  uploadSiteCoverImage,
  uploadSitePanoramaImage,
} from '../lib/adminApi';
import type { AdminSite, AdminSiteInput, BoundaryPreviewResult } from '../lib/adminApi';
import { KNOWN_SITE_CATEGORIES } from '../lib/siteCategories';
import type { Village } from '../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định';
}

function toFormState(site: AdminSite): AdminSiteInput {
  return {
    name: site.name,
    category: site.category,
    subCategory: site.subCategory,
    shortDescription: site.shortDescription,
    lightCount25m: site.lightCount25m,
    historyCultureNote: site.historyCultureNote,
    positionLat: site.positionLat,
    positionLng: site.positionLng,
    boundaryInput: site.rawBoundary ?? '',
  };
}

function parseNumberInput(value: string): number | null {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AdminSitesPage() {
  const [villages, setVillages] = useState<Village[] | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [sites, setSites] = useState<AdminSite[] | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [form, setForm] = useState<AdminSiteInput | null>(null);
  const [previewResult, setPreviewResult] = useState<BoundaryPreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPanorama, setIsUploadingPanorama] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchVillages()
      .then(setVillages)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!selectedVillageId) {
      setSites(null);
      setSelectedSiteId('');
      return;
    }
    setIsLoadingSites(true);
    setError(null);
    setStatusMessage(null);
    setSelectedSiteId('');
    fetchAdminSites(selectedVillageId)
      .then(setSites)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoadingSites(false));
  }, [selectedVillageId]);

  useEffect(() => {
    const selectedSite = sites?.find((item) => item.id === selectedSiteId) ?? null;
    setForm(selectedSite ? toFormState(selectedSite) : null);
    setPreviewResult(null);
    setStatusMessage(null);
  }, [selectedSiteId, sites]);

  const selectedSite = sites?.find((item) => item.id === selectedSiteId) ?? null;

  function updateField<K extends keyof AdminSiteInput>(key: K, value: AdminSiteInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function replaceSiteInList(siteId: string, patch: Partial<AdminSite>) {
    setSites((current) => (current ? current.map((item) => (item.id === siteId ? { ...item, ...patch } : item)) : current));
  }

  async function handlePreviewBoundary() {
    if (!selectedSite || !form?.boundaryInput?.trim()) return;
    setIsPreviewing(true);
    setError(null);
    try {
      const result = await previewSiteBoundary(selectedSite.id, form.boundaryInput);
      setPreviewResult(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleDeleteBoundary() {
    if (!selectedSite) return;
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      await deleteSiteBoundary(selectedSite.id);
      replaceSiteInList(selectedSite.id, { kind: 'point', boundaryPointCount: 0, rawBoundary: null });
      updateField('boundaryInput', '');
      setPreviewResult(null);
      setStatusMessage(`Đã xoá ranh giới điểm "${selectedSite.name}", điểm đã về dạng "point".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedSite || !form) return;
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const updated = await updateAdminSite(selectedSite.id, form);
      replaceSiteInList(selectedSite.id, {
        name: updated.name,
        kind: updated.kind ?? selectedSite.kind,
        boundaryPointCount: updated.vertexCount ?? selectedSite.boundaryPointCount,
        rawBoundary: form.boundaryInput || null,
        positionLat: form.positionLat,
        positionLng: form.positionLng,
      });
      if (updated.detectedFormat && updated.vertexCount !== undefined && updated.areaM2 !== undefined) {
        setStatusMessage(
          `Đã lưu điểm "${updated.name}". Nhận dạng ${updated.detectedFormat}, ${updated.vertexCount} đỉnh, diện tích ${Math.round(updated.areaM2).toLocaleString('vi-VN')} m².`,
        );
      } else {
        setStatusMessage(`Đã lưu thông tin điểm "${updated.name}".`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedSite) return;
    setIsUploadingCover(true);
    setError(null);
    setStatusMessage(null);
    try {
      const { url } = await uploadSiteCoverImage(selectedSite.id, file);
      replaceSiteInList(selectedSite.id, { coverUrl: url });
      setStatusMessage('Đã cập nhật ảnh đại diện.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleCoverRemove() {
    if (!selectedSite) return;
    setIsUploadingCover(true);
    setError(null);
    setStatusMessage(null);
    try {
      await removeSiteCoverImage(selectedSite.id);
      replaceSiteInList(selectedSite.id, { coverUrl: null });
      setStatusMessage('Đã xoá ảnh đại diện.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handlePanoramaUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedSite) return;
    setIsUploadingPanorama(true);
    setError(null);
    setStatusMessage(null);
    try {
      const { url } = await uploadSitePanoramaImage(selectedSite.id, file);
      replaceSiteInList(selectedSite.id, { panoramaUrl: url });
      setStatusMessage('Đã cập nhật ảnh 360°.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingPanorama(false);
    }
  }

  async function handlePanoramaRemove() {
    if (!selectedSite) return;
    setIsUploadingPanorama(true);
    setError(null);
    setStatusMessage(null);
    try {
      await removeSitePanoramaImage(selectedSite.id);
      replaceSiteInList(selectedSite.id, { panoramaUrl: null });
      setStatusMessage('Đã xoá ảnh 360°.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingPanorama(false);
    }
  }

  return (
    <AdminKeyGate title="Chỉnh sửa điểm tham quan">
      <div className="admin-import admin-village-edit">
        <header className="admin-import__header">
          <h1>Chỉnh sửa điểm tham quan</h1>
          <p>Cập nhật thông tin, toạ độ và ảnh của một điểm tham quan (site) trong một làng.</p>
          <AdminNav current="/admin/sites" />
        </header>

        <div className="admin-village-edit__picker admin-sites__picker">
          <div className="admin-village-edit__picker-group">
            <label htmlFor="site-village-picker">Chọn làng</label>
            <select
              id="site-village-picker"
              value={selectedVillageId}
              onChange={(event) => setSelectedVillageId(event.target.value)}
            >
              <option value="">— Chọn một làng —</option>
              {villages?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {selectedVillageId && (
            <div className="admin-village-edit__picker-group">
              <label htmlFor="site-picker">Chọn điểm tham quan</label>
              <select id="site-picker" value={selectedSiteId} onChange={(event) => setSelectedSiteId(event.target.value)}>
                <option value="">— Chọn một điểm —</option>
                {sites?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="admin-import__status admin-import__status--error">{error}</p>}
        {statusMessage && <p className="admin-village-edit__status--ok">{statusMessage}</p>}

        {isLoadingSites && <p className="admin-import__empty">Đang tải danh sách điểm tham quan...</p>}

        {selectedSite && form && (
          <>
            <section className="admin-village-edit__cover admin-sites__images">
              <h3>Ảnh</h3>
              <div className="admin-sites__image-slot">
                <p>Ảnh đại diện</p>
                <div className="admin-village-edit__cover-preview">
                  {selectedSite.coverUrl ? (
                    <SafeImage src={selectedSite.coverUrl} alt={`Ảnh đại diện ${selectedSite.name}`} eager />
                  ) : (
                    <div className="admin-village-edit__cover-empty">Chưa có ảnh</div>
                  )}
                </div>
                <div className="admin-village-edit__cover-actions">
                  <label className="admin-village-edit__upload-btn">
                    {isUploadingCover ? 'Đang xử lý...' : 'Tải ảnh lên'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                      hidden
                    />
                  </label>
                  {selectedSite.coverUrl && (
                    <button
                      type="button"
                      className="admin-btn--danger"
                      onClick={handleCoverRemove}
                      disabled={isUploadingCover}
                    >
                      Xoá ảnh
                    </button>
                  )}
                </div>
              </div>

              <div className="admin-sites__image-slot">
                <p>Ảnh 360°</p>
                <div className="admin-village-edit__cover-preview">
                  {selectedSite.panoramaUrl ? (
                    <SafeImage src={selectedSite.panoramaUrl} alt={`Ảnh 360° ${selectedSite.name}`} eager />
                  ) : (
                    <div className="admin-village-edit__cover-empty">Chưa có ảnh</div>
                  )}
                </div>
                <div className="admin-village-edit__cover-actions">
                  <label className="admin-village-edit__upload-btn">
                    {isUploadingPanorama ? 'Đang xử lý...' : 'Tải ảnh lên'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePanoramaUpload}
                      disabled={isUploadingPanorama}
                      hidden
                    />
                  </label>
                  {selectedSite.panoramaUrl && (
                    <button
                      type="button"
                      className="admin-btn--danger"
                      onClick={handlePanoramaRemove}
                      disabled={isUploadingPanorama}
                    >
                      Xoá ảnh
                    </button>
                  )}
                </div>
              </div>
            </section>

            <form className="admin-village-edit__form" onSubmit={handleSubmit}>
              <label>
                Tên điểm
                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
              </label>

              <label>
                Loại điểm
                <input
                  list="site-category-suggestions"
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                  required
                />
                <datalist id="site-category-suggestions">
                  {KNOWN_SITE_CATEGORIES.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>

              <label>
                Loại phụ
                <input
                  value={form.subCategory ?? ''}
                  onChange={(event) => updateField('subCategory', event.target.value)}
                />
              </label>

              <label>
                Mô tả ngắn
                <textarea
                  value={form.shortDescription ?? ''}
                  onChange={(event) => updateField('shortDescription', event.target.value)}
                  rows={3}
                />
              </label>

              <label>
                Số đèn trong bán kính 25m
                <input
                  type="number"
                  value={form.lightCount25m ?? ''}
                  onChange={(event) => updateField('lightCount25m', parseNumberInput(event.target.value))}
                />
              </label>

              <label>
                Ghi chú lịch sử/văn hoá
                <textarea
                  value={form.historyCultureNote ?? ''}
                  onChange={(event) => updateField('historyCultureNote', event.target.value)}
                  rows={3}
                />
              </label>

              <div className="admin-sites__position">
                <label>
                  Vĩ độ (lat)
                  <input
                    type="number"
                    step="any"
                    value={form.positionLat ?? ''}
                    onChange={(event) => updateField('positionLat', parseNumberInput(event.target.value))}
                    required
                  />
                </label>
                <label>
                  Kinh độ (lng)
                  <input
                    type="number"
                    step="any"
                    value={form.positionLng ?? ''}
                    onChange={(event) => updateField('positionLng', parseNumberInput(event.target.value))}
                    required
                  />
                </label>
              </div>

              <div className="admin-sites__boundary">
                <label>
                  Toạ độ ranh giới (GeoJSON, mảng [[vĩ độ, kinh độ]], hoặc khối &lt;coordinates&gt; dán từ KML)
                  <textarea
                    value={form.boundaryInput ?? ''}
                    onChange={(event) => {
                      updateField('boundaryInput', event.target.value);
                      setPreviewResult(null);
                    }}
                    rows={5}
                    placeholder="Dán toạ độ GeoJSON ({...}), khối <coordinates> từ KML, hoặc mảng [[lat, lng], ...]"
                  />
                </label>

                <div className="admin-sites__boundary-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    className="admin-btn--secondary"
                    onClick={handlePreviewBoundary}
                    disabled={isPreviewing || !form.boundaryInput?.trim()}
                  >
                    {isPreviewing ? 'Đang kiểm tra...' : 'Xem trước ranh giới'}
                  </button>
                  {selectedSite.kind === 'area' && (
                    <button
                      type="button"
                      className="admin-btn--danger"
                      onClick={handleDeleteBoundary}
                      disabled={isSaving}
                    >
                      Xoá ranh giới (về point)
                    </button>
                  )}
                </div>

                {previewResult && (
                  <div className="admin-sites__preview-info" style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--color-surface-variant, #f5f5f5)', borderRadius: '4px' }}>
                    {previewResult.errors.length > 0 ? (
                      <div>
                        {previewResult.errors.map((errItem, idx) => (
                          <p key={idx} className="admin-import__status admin-import__status--error" style={{ margin: '0.2rem 0' }}>
                            {errItem}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p style={{ margin: 0, fontWeight: 500 }}>
                          Phát hiện định dạng <strong>{previewResult.detectedFormat}</strong>, {previewResult.vertexCount} đỉnh, diện tích xấp xỉ <strong>{Math.round(previewResult.areaM2).toLocaleString('vi-VN')} m²</strong>.
                        </p>
                        {previewResult.warnings.map((w, idx) => (
                          <p key={idx} className="admin-import__status admin-import__status--warning" style={{ margin: '0.2rem 0' }}>
                            {w}
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </form>
          </>
        )}
      </div>
    </AdminKeyGate>
  );
}
