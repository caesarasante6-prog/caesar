'use client';
import { useState } from 'react';
import { H } from './util';

export default function ChangePassword() {
  const [f, setF] = useState({ current: '', next: '' });
  const [m, setM] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function go(e) {
    e.preventDefault(); setBusy(true); setM('');
    const r = await fetch('/api/me/password', { method: 'POST', headers: H, body: JSON.stringify(f) });
    const j = await r.json();
    setBusy(false); setOk(r.ok); setM(j.message || j.error);
    if (r.ok) setF({ current: '', next: '' });
  }

  return (
    <form className="card" onSubmit={go} style={{ maxWidth: 420, display: 'grid', gap: '1rem' }}>
      <h3>Change password</h3>
      <label>Current password<input type="password" required value={f.current} onChange={e => setF({ ...f, current: e.target.value })} autoComplete="current-password" /></label>
      <label>New password (8+ characters)<input type="password" minLength={8} required value={f.next} onChange={e => setF({ ...f, next: e.target.value })} autoComplete="new-password" /></label>
      {m && <p className={ok ? '' : 'err'} role="status" style={ok ? { color: 'var(--laurel)', fontWeight: 600 } : undefined}>{m}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving' : 'Save new password'}</button>
    </form>
  );
}
