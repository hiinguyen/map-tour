import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AdminKeyGate } from '../components/AdminKeyGate';
import { AdminNav } from '../components/AdminNav';
import { SafeImage } from '../components/SafeImage';
import { fetchVillages } from '../lib/api';
import {
  deleteMediaItem,
  fetchAdminHeritageBuildings,
  updateAdminHeritageBuilding,
  updateMediaItem,
  uploadHeritageBuildingPhoto,
} from '../lib/adminApi';
import type { AdminHeritageBuilding, AdminHeritageBuildingInput, AdminHeritageBuildingPhoto } from '../lib/adminApi';
import type { Village } from '../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định';
}

function toFormState(building: AdminHeritageBuilding): AdminHeritageBuildingInput {
  return {
    name: building.name,
    address: building.address,
    function: building.function,
    ownership: building.ownership,
    landAreaM2: building.landAreaM2,
    floorAreaM2: building.floorAreaM2,
    heritageRank: building.heritageRank,
    heritageRankYear: building.heritageRankYear,
    heritageStyleType: building.heritageStyleType,
    managingUnit: building.managingUnit,
    overallStructureDescription: building.overallStructureDescription,
    culturalHistoricalValue: building.culturalHistoricalValue,
    builtPeriod: building.builtPeriod,
    restorationNote: building.restorationNote,
    technicalDetails: { ...building.technicalDetails },
  };
}

function parseNumberInput(value: string): number | null {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type PhotoEditState = { caption: string; attribution: string };

function PhotoCard({
  photo,
  onSave,
  onDelete,
}: {
  photo: AdminHeritageBuildingPhoto;
  onSave: (photoId: string, edit: PhotoEditState) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}) {
  const [edit, setEdit] = useState<PhotoEditState>({ caption: photo.caption ?? '', attribution: photo.attribution ?? '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(photo.id, edit);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(photo.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <article className="admin-heritage__photo-card">
      <div className="admin-village-edit__cover-preview">
        <SafeImage src={photo.url} alt={photo.caption ?? 'Ảnh công trình'} />
      </div>
      <label>
        Chú thích
        <input value={edit.caption} onChange={(event) => setEdit((current) => ({ ...current, caption: event.target.value }))} />
      </label>
      <label>
        Nguồn/Tác giả
        <input
          value={edit.attribution}
          onChange={(event) => setEdit((current) => ({ ...current, attribution: event.target.value }))}
        />
      </label>
      <div className="admin-village-edit__cover-actions">
        <button type="button" onClick={handleSave} disabled={isSaving || isDeleting}>
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button type="button" className="admin-btn--danger" onClick={handleDelete} disabled={isSaving || isDeleting}>
          {isDeleting ? 'Đang xoá...' : 'Xoá'}
        </button>
      </div>
    </article>
  );
}

export function AdminHeritageBuildingsPage() {
  const [villages, setVillages] = useState<Village[] | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [buildings, setBuildings] = useState<AdminHeritageBuilding[] | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [form, setForm] = useState<AdminHeritageBuildingInput | null>(null);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newPhotoKind, setNewPhotoKind] = useState<'anh' | 'panorama'>('anh');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchVillages()
      .then(setVillages)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!selectedVillageId) {
      setBuildings(null);
      setSelectedBuildingId('');
      return;
    }
    setIsLoadingBuildings(true);
    setError(null);
    setStatusMessage(null);
    setSelectedBuildingId('');
    fetchAdminHeritageBuildings(selectedVillageId)
      .then(setBuildings)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoadingBuildings(false));
  }, [selectedVillageId]);

  useEffect(() => {
    const selectedBuilding = buildings?.find((item) => item.id === selectedBuildingId) ?? null;
    setForm(selectedBuilding ? toFormState(selectedBuilding) : null);
    setStatusMessage(null);
  }, [selectedBuildingId, buildings]);

  const selectedBuilding = buildings?.find((item) => item.id === selectedBuildingId) ?? null;

  function updateField<K extends keyof Omit<AdminHeritageBuildingInput, 'technicalDetails'>>(
    key: K,
    value: AdminHeritageBuildingInput[K],
  ) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateTechnicalDetailsField<K extends keyof AdminHeritageBuildingInput['technicalDetails']>(
    key: K,
    value: AdminHeritageBuildingInput['technicalDetails'][K],
  ) {
    setForm((current) =>
      current ? { ...current, technicalDetails: { ...current.technicalDetails, [key]: value } } : current,
    );
  }

  function replaceBuildingInList(buildingId: string, patch: Partial<AdminHeritageBuilding>) {
    setBuildings((current) =>
      current ? current.map((item) => (item.id === buildingId ? { ...item, ...patch } : item)) : current,
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedBuilding || !form) return;
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const updated = await updateAdminHeritageBuilding(selectedBuilding.id, form);
      replaceBuildingInList(selectedBuilding.id, { ...form, name: updated.name });
      setStatusMessage(`Đã lưu thông tin công trình "${updated.name}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedBuilding) return;
    setIsUploadingPhoto(true);
    setError(null);
    setStatusMessage(null);
    try {
      const photo = await uploadHeritageBuildingPhoto(selectedBuilding.id, file, newPhotoKind);
      replaceBuildingInList(selectedBuilding.id, { photos: [...selectedBuilding.photos, photo] });
      setStatusMessage('Đã thêm ảnh mới.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handlePhotoSave(photoId: string, edit: PhotoEditState) {
    if (!selectedBuilding) return;
    setError(null);
    setStatusMessage(null);
    try {
      const photo = selectedBuilding.photos.find((item) => item.id === photoId);
      if (!photo) return;
      const updated = await updateMediaItem(photoId, {
        url: photo.url,
        caption: edit.caption.trim() || null,
        attribution: edit.attribution.trim() || null,
      });
      replaceBuildingInList(selectedBuilding.id, {
        photos: selectedBuilding.photos.map((item) =>
          item.id === photoId ? { ...item, caption: updated.caption, attribution: updated.attribution } : item,
        ),
      });
      setStatusMessage('Đã lưu chú thích ảnh.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handlePhotoDelete(photoId: string) {
    if (!selectedBuilding) return;
    setError(null);
    setStatusMessage(null);
    try {
      await deleteMediaItem(photoId);
      replaceBuildingInList(selectedBuilding.id, {
        photos: selectedBuilding.photos.filter((item) => item.id !== photoId),
      });
      setStatusMessage('Đã xoá ảnh.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <AdminKeyGate title="Chỉnh sửa công trình di sản">
      <div className="admin-import admin-village-edit">
        <header className="admin-import__header">
          <h1>Chỉnh sửa công trình di sản</h1>
          <p>Cập nhật thông tin chung, chi tiết kỹ thuật và thư viện ảnh của một công trình di sản.</p>
          <AdminNav current="/admin/heritage-buildings" />
        </header>

        <div className="admin-village-edit__picker admin-sites__picker">
          <div className="admin-village-edit__picker-group">
            <label htmlFor="heritage-village-picker">Chọn làng</label>
            <select
              id="heritage-village-picker"
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
              <label htmlFor="heritage-building-picker">Chọn công trình</label>
              <select
                id="heritage-building-picker"
                value={selectedBuildingId}
                onChange={(event) => setSelectedBuildingId(event.target.value)}
              >
                <option value="">— Chọn một công trình —</option>
                {buildings?.map((item) => (
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

        {isLoadingBuildings && <p className="admin-import__empty">Đang tải danh sách công trình...</p>}

        {selectedBuilding && form && (
          <>
            <form className="admin-village-edit__form" onSubmit={handleSubmit}>
              <section className="admin-heritage__section">
                <h3>Thông tin chung</h3>
                <label>
                  Tên công trình
                  <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
                </label>
                <label>
                  Địa chỉ
                  <input value={form.address ?? ''} onChange={(event) => updateField('address', event.target.value)} />
                </label>
                <label>
                  Chức năng
                  <input value={form.function ?? ''} onChange={(event) => updateField('function', event.target.value)} />
                </label>
                <label>
                  Chủ sở hữu
                  <input value={form.ownership ?? ''} onChange={(event) => updateField('ownership', event.target.value)} />
                </label>
                <label>
                  Diện tích đất (m²)
                  <input
                    type="number"
                    value={form.landAreaM2 ?? ''}
                    onChange={(event) => updateField('landAreaM2', parseNumberInput(event.target.value))}
                  />
                </label>
                <label>
                  Diện tích sàn (m²)
                  <input
                    type="number"
                    value={form.floorAreaM2 ?? ''}
                    onChange={(event) => updateField('floorAreaM2', parseNumberInput(event.target.value))}
                  />
                </label>
                <label>
                  Xếp hạng di tích
                  <input
                    value={form.heritageRank ?? ''}
                    onChange={(event) => updateField('heritageRank', event.target.value)}
                  />
                </label>
                <label>
                  Năm xếp hạng
                  <input
                    type="number"
                    value={form.heritageRankYear ?? ''}
                    onChange={(event) => updateField('heritageRankYear', parseNumberInput(event.target.value))}
                  />
                </label>
                <label>
                  Loại hình kiến trúc
                  <input
                    value={form.heritageStyleType ?? ''}
                    onChange={(event) => updateField('heritageStyleType', event.target.value)}
                  />
                </label>
                <label>
                  Đơn vị quản lý
                  <input
                    value={form.managingUnit ?? ''}
                    onChange={(event) => updateField('managingUnit', event.target.value)}
                  />
                </label>
                <label>
                  Thời kỳ xây dựng
                  <input value={form.builtPeriod ?? ''} onChange={(event) => updateField('builtPeriod', event.target.value)} />
                </label>
                <label>
                  Mô tả kết cấu tổng thể
                  <textarea
                    value={form.overallStructureDescription ?? ''}
                    onChange={(event) => updateField('overallStructureDescription', event.target.value)}
                    rows={3}
                  />
                </label>
                <label>
                  Giá trị lịch sử văn hoá
                  <textarea
                    value={form.culturalHistoricalValue ?? ''}
                    onChange={(event) => updateField('culturalHistoricalValue', event.target.value)}
                    rows={3}
                  />
                </label>
                <label>
                  Ghi chú trùng tu
                  <textarea
                    value={form.restorationNote ?? ''}
                    onChange={(event) => updateField('restorationNote', event.target.value)}
                    rows={3}
                  />
                </label>
              </section>

              <section className="admin-heritage__section">
                <h3>Chi tiết kỹ thuật</h3>
                <label>
                  Số lớp mái
                  <input
                    value={form.technicalDetails.roofLayers ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('roofLayers', event.target.value)}
                  />
                </label>
                <label>
                  Kiểu dáng mái
                  <input
                    value={form.technicalDetails.roofShape ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('roofShape', event.target.value)}
                  />
                </label>
                <label>
                  Vật liệu mái
                  <input
                    value={form.technicalDetails.roofMaterial ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('roofMaterial', event.target.value)}
                  />
                </label>
                <label>
                  Màu sắc mái
                  <input
                    value={form.technicalDetails.roofColor ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('roofColor', event.target.value)}
                  />
                </label>
                <label>
                  Vật liệu mặt tiền
                  <input
                    value={form.technicalDetails.facadeMaterial ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('facadeMaterial', event.target.value)}
                  />
                </label>
                <label>
                  Tình trạng mặt tiền
                  <input
                    value={form.technicalDetails.facadeCondition ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('facadeCondition', event.target.value)}
                  />
                </label>
                <label>
                  Vật liệu nền
                  <input
                    value={form.technicalDetails.floorMaterial ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('floorMaterial', event.target.value)}
                  />
                </label>
                <label>
                  Hoạ tiết nền
                  <input
                    value={form.technicalDetails.floorPattern ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('floorPattern', event.target.value)}
                  />
                </label>
                <label>
                  Vật liệu kết cấu
                  <input
                    value={form.technicalDetails.structureMaterial ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('structureMaterial', event.target.value)}
                  />
                </label>
                <label>
                  Tình trạng kết cấu
                  <input
                    value={form.technicalDetails.structureCondition ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('structureCondition', event.target.value)}
                  />
                </label>
                <label>
                  Chiều cao cột (cm)
                  <input
                    type="number"
                    value={form.technicalDetails.columnHeightCm ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('columnHeightCm', parseNumberInput(event.target.value))}
                  />
                </label>
                <label>
                  Đường kính cột (cm)
                  <input
                    type="number"
                    value={form.technicalDetails.columnDiameterCm ?? ''}
                    onChange={(event) =>
                      updateTechnicalDetailsField('columnDiameterCm', parseNumberInput(event.target.value))
                    }
                  />
                </label>
                <label>
                  Vật liệu chân tảng
                  <input
                    value={form.technicalDetails.pedestalMaterial ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('pedestalMaterial', event.target.value)}
                  />
                </label>
                <label>
                  Kích thước chân tảng
                  <input
                    value={form.technicalDetails.pedestalSize ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('pedestalSize', event.target.value)}
                  />
                </label>
                <label>
                  Kiểu chân tảng
                  <input
                    value={form.technicalDetails.pedestalType ?? ''}
                    onChange={(event) => updateTechnicalDetailsField('pedestalType', event.target.value)}
                  />
                </label>
              </section>

              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </form>

            <section className="admin-heritage__section admin-heritage__section--gallery">
              <h3>Thư viện ảnh</h3>
              <div className="admin-village-edit__cover-actions">
                <select value={newPhotoKind} onChange={(event) => setNewPhotoKind(event.target.value as 'anh' | 'panorama')}>
                  <option value="anh">Ảnh thường</option>
                  <option value="panorama">Ảnh 360°</option>
                </select>
                <label className="admin-village-edit__upload-btn">
                  {isUploadingPhoto ? 'Đang tải lên...' : 'Thêm ảnh'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    hidden
                  />
                </label>
              </div>
              <div className="admin-heritage__photos">
                {selectedBuilding.photos.length === 0 && <p className="admin-import__empty">Chưa có ảnh nào.</p>}
                {selectedBuilding.photos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} onSave={handlePhotoSave} onDelete={handlePhotoDelete} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminKeyGate>
  );
}
