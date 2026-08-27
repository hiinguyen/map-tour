import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { getAdminKey, setAdminKey } from '../lib/adminApi';

type Props = {
  title: string;
  children: ReactNode;
};

export function AdminKeyGate({ title, children }: Props) {
  const [adminKeyInput, setAdminKeyInput] = useState(getAdminKey());
  const [hasAdminKey, setHasAdminKey] = useState(getAdminKey().length > 0);

  function handleSaveKey(event: FormEvent) {
    event.preventDefault();
    setAdminKey(adminKeyInput.trim());
    setHasAdminKey(adminKeyInput.trim().length > 0);
  }

  if (hasAdminKey) return <>{children}</>;

  return (
    <div className="admin-import admin-key-gate">
      <header className="admin-import__header">
        <h1>{title}</h1>
      </header>
      <form className="admin-import__key-form" onSubmit={handleSaveKey}>
        <label htmlFor="admin-key">Khóa quản trị</label>
        <input
          id="admin-key"
          type="password"
          value={adminKeyInput}
          onChange={(event) => setAdminKeyInput(event.target.value)}
          placeholder="Nhập khóa admin để tiếp tục"
          autoFocus
        />
        <button type="submit" disabled={!adminKeyInput.trim()}>
          Tiếp tục
        </button>
      </form>
    </div>
  );
}
