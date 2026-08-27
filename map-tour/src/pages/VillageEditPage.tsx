import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AdminKeyGate } from '../components/AdminKeyGate';
import { AdminNav } from '../components/AdminNav';
import { SafeImage } from '../components/SafeImage';
import { fetchVillageDetails, fetchVillages } from '../lib/api';
import { removeVillageCoverImage, updateVillageBasicInfo, uploadVillageCoverImage } from '../lib/adminApi';
import type { VillageBasicInfoInput } from '../lib/adminApi';
import type { Village, VillageDetails } from '../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định';
}

function toFormState(village: VillageDetails): VillageBasicInfoInput {
  return {
    name: village.name,
    aliases: village.aliases,
    adminLocation: village.adminLocation,
    googleMapsLink: village.googleMapsLink,
    foundedPeriod: village.foundedPeriod,
    brandIdentity: village.brandIdentity,
    nameMeaning: village.nameMeaning,
    mainOccupations: village.mainOccupations,
    naturalFeatures: village.naturalFeatures,
    siteSelectionHistory: village.siteSelectionHistory,
    morphologyDescription: village.morphologyDescription,
  };
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function VillageEditPage() {
  const [villages, setVillages] = useState<Village[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [village, setVillage] = useState<VillageDetails | null>(null);
  const [form, setForm] = useState<VillageBasicInfoInput | null>(null);
  const [isLoadingVillage, setIsLoadingVillage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchVillages()
      .then(setVillages)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!selectedSlug) {
      setVillage(null);
      setForm(null);
      return;
    }
    const controller = new AbortController();
    setIsLoadingVillage(true);
    setError(null);
    setStatusMessage(null);
    fetchVillageDetails(selectedSlug, controller.signal)
      .then((details) => {
        setVillage(details);
        setForm(toFormState(details));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingVillage(false);
      });
    return () => controller.abort();
  }, [selectedSlug]);

  function updateField<K extends keyof VillageBasicInfoInput>(key: K, value: VillageBasicInfoInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!village || !form) return;
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const updated = await updateVillageBasicInfo(village.id, form);
      setStatusMessage(`Đã lưu thông tin làng "${updated.name}".`);
      setVillages((current) =>
        current ? current.map((item) => (item.id === updated.id ? { ...item, name: updated.name } : item)) : current,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !village) return;
    setIsUploadingCover(true);
    setError(null);
    setStatusMessage(null);
    try {
      const { coverUrl } = await uploadVillageCoverImage(village.id, file);
      setVillage((current) => (current ? { ...current, coverUrl } : current));
      setStatusMessage('Đã cập nhật ảnh đại diện.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleCoverRemove() {
    if (!village) return;
    setIsUploadingCover(true);
    setError(null);
    setStatusMessage(null);
    try {
      await removeVillageCoverImage(village.id);
      setVillage((current) => (current ? { ...current, coverUrl: null } : current));
      setStatusMessage('Đã xoá ảnh đại diện.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingCover(false);
    }
  }

  return (
    <AdminKeyGate title="Chỉnh sửa thông tin làng">
      <div className="admin-import admin-village-edit">
        <header className="admin-import__header">
          <h1>Chỉnh sửa thông tin làng</h1>
          <p>Cập nhật ảnh đại diện, tên và các thông tin cơ bản của một làng đã có trong hệ thống.</p>
          <AdminNav current="/admin/villages" />
        </header>

        <div className="admin-village-edit__picker">
          <label htmlFor="village-picker">Chọn làng</label>
          <select id="village-picker" value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)}>
            <option value="">— Chọn một làng —</option>
            {villages?.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="admin-import__status admin-import__status--error">{error}</p>}
        {statusMessage && <p className="admin-village-edit__status--ok">{statusMessage}</p>}

        {isLoadingVillage && <p className="admin-import__empty">Đang tải thông tin làng...</p>}

        {village && form && (
          <>
            <section className="admin-village-edit__cover">
              <h3>Ảnh đại diện</h3>
              <div className="admin-village-edit__cover-preview">
                {village.coverUrl ? (
                  <SafeImage src={village.coverUrl} alt={`Ảnh đại diện ${village.name}`} eager />
                ) : (
                  <div className="admin-village-edit__cover-empty">Chưa có ảnh đại diện</div>
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
                {village.coverUrl && (
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
            </section>

            <form className="admin-village-edit__form" onSubmit={handleSubmit}>
              <label>
                Tên làng
                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
              </label>

              <label>
                Tên gọi khác (cách nhau bởi dấu phẩy)
                <input
                  value={form.aliases.join(', ')}
                  onChange={(event) => updateField('aliases', splitList(event.target.value))}
                />
              </label>

              <label>
                Địa giới hành chính
                <input
                  value={form.adminLocation ?? ''}
                  onChange={(event) => updateField('adminLocation', event.target.value)}
                />
              </label>

              <label>
                Liên kết Google Maps
                <input
                  value={form.googleMapsLink ?? ''}
                  onChange={(event) => updateField('googleMapsLink', event.target.value)}
                />
              </label>

              <label>
                Thời điểm hình thành
                <input
                  value={form.foundedPeriod ?? ''}
                  onChange={(event) => updateField('foundedPeriod', event.target.value)}
                />
              </label>

              <label>
                Bản sắc thương hiệu
                <input
                  value={form.brandIdentity ?? ''}
                  onChange={(event) => updateField('brandIdentity', event.target.value)}
                />
              </label>

              <label>
                Ý nghĩa tên gọi
                <input
                  value={form.nameMeaning ?? ''}
                  onChange={(event) => updateField('nameMeaning', event.target.value)}
                />
              </label>

              <label>
                Nghề chính (cách nhau bởi dấu phẩy)
                <input
                  value={form.mainOccupations.join(', ')}
                  onChange={(event) => updateField('mainOccupations', splitList(event.target.value))}
                />
              </label>

              <label>
                Đặc điểm tự nhiên
                <textarea
                  value={form.naturalFeatures ?? ''}
                  onChange={(event) => updateField('naturalFeatures', event.target.value)}
                  rows={3}
                />
              </label>

              <label>
                Lịch sử chọn đất lập làng
                <textarea
                  value={form.siteSelectionHistory ?? ''}
                  onChange={(event) => updateField('siteSelectionHistory', event.target.value)}
                  rows={3}
                />
              </label>

              <label>
                Mô tả hình thái làng
                <textarea
                  value={form.morphologyDescription ?? ''}
                  onChange={(event) => updateField('morphologyDescription', event.target.value)}
                  rows={3}
                />
              </label>

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
