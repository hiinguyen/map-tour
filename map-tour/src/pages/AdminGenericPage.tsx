import { Fragment, useEffect, useState } from 'react';
import { AdminKeyGate } from '../components/AdminKeyGate';
import { AdminNav } from '../components/AdminNav';
import { fetchGenericEntities, fetchGenericRows, updateGenericRow } from '../lib/adminApi';
import type { GenericEntityMeta, GenericFieldConfig, GenericRow } from '../lib/adminApi';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định';
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

type FieldValue = string | boolean | string[] | null;

type Props = {
  field: GenericFieldConfig;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
};

function GenericFieldInput({ field, value, onChange }: Props) {
  if (field.type === 'text') {
    return <input value={(value as string) ?? ''} onChange={(event) => onChange(event.target.value)} />;
  }
  if (field.type === 'textarea') {
    return <textarea rows={4} value={(value as string) ?? ''} onChange={(event) => onChange(event.target.value)} />;
  }
  if (field.type === 'boolean') {
    const current = value === true ? 'true' : value === false ? 'false' : '';
    return (
      <select value={current} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'true')}>
        <option value="">Không rõ</option>
        <option value="true">Có</option>
        <option value="false">Không</option>
      </select>
    );
  }
  if (field.type === 'select') {
    const current = (value as string) ?? '';
    return (
      <select value={current} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}>
        {!field.required && <option value="">— Chọn —</option>}
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  const arrayValue = Array.isArray(value) ? value : [];
  return <input value={arrayValue.join(', ')} onChange={(event) => onChange(splitList(event.target.value))} />;
}

export function AdminGenericPage() {
  const [entities, setEntities] = useState<GenericEntityMeta[] | null>(null);
  const [selectedEntityKey, setSelectedEntityKey] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<GenericRow[] | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, FieldValue> | null>(null);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchGenericEntities()
      .then(setEntities)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    setSelectedRowId(null);
    setSearch('');
    setRows(null);
  }, [selectedEntityKey]);

  useEffect(() => {
    if (!selectedEntityKey) return;
    const timeoutId = setTimeout(() => {
      setIsLoadingRows(true);
      setError(null);
      fetchGenericRows(selectedEntityKey, search || undefined)
        .then(setRows)
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setIsLoadingRows(false));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedEntityKey, search]);

  useEffect(() => {
    const row = rows?.find((item) => item.id === selectedRowId) ?? null;
    setEditFields(row ? { ...row.fields } : null);
    setStatusMessage(null);
  }, [selectedRowId, rows]);

  const selectedEntity = entities?.find((item) => item.key === selectedEntityKey) ?? null;
  const selectedRow = rows?.find((item) => item.id === selectedRowId) ?? null;

  function updateEditField(name: string, value: FieldValue) {
    setEditFields((current) => (current ? { ...current, [name]: value } : current));
  }

  async function handleSave() {
    if (!selectedEntityKey || !selectedRowId || !editFields) return;
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const updated = await updateGenericRow(selectedEntityKey, selectedRowId, editFields);
      setRows((current) => (current ? current.map((item) => (item.id === updated.id ? updated : item)) : current));
      setStatusMessage('Đã lưu thay đổi.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminKeyGate title="Dữ liệu khác">
      <div className="admin-import admin-village-edit">
        <header className="admin-import__header">
          <h1>Dữ liệu khác</h1>
          <p>Chỉnh sửa lịch sử, mỹ thuật trang trí, di sản phi vật thể, sản phẩm nghề và thư viện media.</p>
          <AdminNav current="/admin/data" />
        </header>

        <div className="admin-village-edit__picker">
          <label htmlFor="generic-entity-picker">Loại dữ liệu</label>
          <select
            id="generic-entity-picker"
            value={selectedEntityKey}
            onChange={(event) => setSelectedEntityKey(event.target.value)}
          >
            <option value="">— Chọn loại dữ liệu —</option>
            {entities?.map((entity) => (
              <option key={entity.key} value={entity.key}>
                {entity.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="admin-import__status admin-import__status--error">{error}</p>}
        {statusMessage && <p className="admin-village-edit__status--ok">{statusMessage}</p>}

        {selectedEntityKey && (
          <div className="admin-generic__layout">
            <div className="admin-generic__list">
              <input
                type="search"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {isLoadingRows && <p className="admin-import__empty">Đang tải...</p>}
              {rows?.length === 0 && !isLoadingRows && <p className="admin-import__empty">Không có bản ghi nào.</p>}
              {rows?.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`admin-generic__row${row.id === selectedRowId ? ' admin-generic__row--active' : ''}`}
                  onClick={() => setSelectedRowId(row.id)}
                >
                  <span>{row.title}</span>
                  {row.subtitle && <span className="admin-generic__row-subtitle"> ({row.subtitle})</span>}
                </button>
              ))}
            </div>

            <div className="admin-generic__form">
              {selectedEntity && selectedRow && editFields && (
                <>
                  {selectedEntity.context.length > 0 && (
                    <dl className="admin-import__fields admin-generic__context">
                      {selectedEntity.context.map((contextField) => (
                        <Fragment key={contextField.name}>
                          <dt>{contextField.label}</dt>
                          <dd>{selectedRow.context[contextField.name] ?? '—'}</dd>
                        </Fragment>
                      ))}
                    </dl>
                  )}

                  <div className="admin-village-edit__form">
                    {selectedEntity.fields.map((fieldConfig) => (
                      <label key={fieldConfig.name} className="admin-generic__field">
                        {fieldConfig.label}
                        <GenericFieldInput
                          field={fieldConfig}
                          value={editFields[fieldConfig.name] ?? null}
                          onChange={(value) => updateEditField(fieldConfig.name, value)}
                        />
                      </label>
                    ))}
                    <button type="button" className="admin-btn--primary" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </>
              )}
              {!selectedRow && <p className="admin-import__empty">Chọn một bản ghi ở danh sách bên trái để chỉnh sửa.</p>}
            </div>
          </div>
        )}
      </div>
    </AdminKeyGate>
  );
}
