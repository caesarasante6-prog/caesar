'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Shell from './Shell';
import ChangePassword from './ChangePassword';
import { fd, H } from './util';

const DAY = 864e5;
const safe = (c) => { const s = String(c ?? ''); return /^[=+\-@]/.test(s) ? `'${s}` : s; };

function Hash({ h }) {
  const [open, setOpen] = useState(false);
  return <code className="hash" title="Click to show or hide" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>{open ? h : h.slice(0, 24) + '…'}</code>;
}

export default function AdminDash({ user }) {
  const [tab, setTab] = useState('Overview');
  const [d, setD] = useState({ users: [], logs: [], lastBackup: null });
  const [bk, setBk] = useState([]);
  const [f, setF] = useState('All');
  const [role, setRole] = useState('all');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });

  const load = useCallback(async () => {
    const r = await fetch('/api/admin'); if (r.ok) setD(await r.json());
    const b = await fetch('/api/admin?backups=1'); if (b.ok) setBk((await b.json()).backups);
  }, []);
  useEffect(() => { load(); setMounted(true); }, [load]);

  async function act(body) {
    const r = await fetch('/api/admin', { method: 'POST', headers: H, body: JSON.stringify(body) });
    const j = await r.json();
    setToast(j.message || j.error); setTimeout(() => setToast(''), 3500);
    if (r.ok) load();
    return r.ok;
  }

  const live = d.users.filter(u => !u.deleted);
  const deleted = d.users.length - live.length;
  const count = r => live.filter(u => u.role === r).length;
  const week = live.filter(u => Date.now() - new Date(u.created_at) < 7 * DAY).length;
  const shown = d.users.filter(u => (f === 'All' || (f === 'Deleted') === u.deleted) && (role === 'all' || u.role === role) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const sf = k => e => setForm({ ...form, [k]: e.target.value });

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - (6 - i));
    const e = new Date(t); e.setDate(e.getDate() + 1);
    return { label: t.toLocaleDateString([], { weekday: 'short' }), n: d.users.filter(u => { const c = new Date(u.created_at); return c >= t && c < e; }).length };
  }), [d.users]);
  const max = Math.max(1, ...days.map(x => x.n));

  function exportCsv() {
    const rows = [['Name', 'Email', 'Role', 'Status', 'Joined', 'Last login'], ...d.users.map(u => [u.name, u.email, u.role, u.deleted ? 'Deleted' : 'Active', u.created_at, u.last_login || ''])];
    const csv = rows.map(r => r.map(c => `"${safe(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'caesar-members.csv'; a.click();
  }

  return (
    <Shell user={user} tabs={['Overview', 'Members', 'Backups', 'Activity', 'Password']} tab={tab} setTab={setTab} toast={toast}>
      {tab === 'Overview' && (<>
        <div className="head"><div><h1>Admin overview</h1><p>Everything happening across the organisation.</p></div>
          <button className="btn" disabled={busy} onClick={async () => { setBusy(true); await act({ action: 'backup' }); setBusy(false); }}>{busy ? 'Backing up' : 'Back up now'}</button></div>
        {deleted > 0 && <div className="alert"><span><b>{deleted}</b> deleted {deleted === 1 ? 'account is' : 'accounts are'} waiting. You can restore {deleted === 1 ? 'it' : 'them'} any time.</span><button className="btn sm" onClick={() => { setF('Deleted'); setTab('Members'); }}>Review</button></div>}
        <div className="stats">
          <div className="stat"><b>{live.length}</b><span>Active members</span></div>
          <div className="stat"><b>{count('admin') + count('staff')}</b><span>Admins and staff</span></div>
          <div className="stat"><b>{week}</b><span>Joined this week</span></div>
          <div className="stat"><b>{deleted}</b><span>Deleted accounts</span></div>
        </div>
        <div className="two">
          <div className="card"><h3>Role mix</h3>
            <div className="bar">{['admin', 'staff', 'user'].map(r => <i key={r} className={`c-${r}`} style={{ width: `${live.length ? count(r) / live.length * 100 : 0}%` }} />)}</div>
            <div className="legend">{['admin', 'staff', 'user'].map(r => <span key={r}><i className={`c-${r}`} />{r}: {count(r)}</span>)}</div>
          </div>
          <div className="card"><h3>New members, last 7 days</h3>
            {mounted && <div className="spark">{days.map((x, i) => <div key={i}><span>{x.n}</span><b style={{ height: `${x.n / max * 70}%` }} /><span>{x.label}</span></div>)}</div>}
          </div>
        </div>
        <div className="two">
          <div className="card"><h3>Backups</h3>
            <p className="muted">Last backup: <b style={{ color: 'var(--text)' }}>{d.lastBackup ? fd(d.lastBackup) : 'none yet'}</b></p>
            <p className="muted" style={{ marginTop: '.5rem' }}>A backup also runs automatically every night. Restore from the Backups tab.</p>
          </div>
          <div className="card"><h3>Latest activity</h3>
            {d.logs.slice(0, 4).map((l, i) => <div className="log" key={i}><span><b>{l.actor}</b> {l.action}</span></div>)}
            {d.logs.length === 0 && <p className="muted">Nothing yet.</p>}
          </div>
        </div>
      </>)}

      {tab === 'Members' && (<>
        <div className="head"><div><h1>Members</h1><p>{live.length} active, {deleted} deleted</p></div>
          <div className="tools" style={{ margin: 0 }}><button className="btn ghost sm" onClick={exportCsv}>Export CSV</button><button className="btn sm" onClick={() => setAdding(!adding)}>{adding ? 'Close' : 'Add member'}</button></div></div>
        {adding && <form className="card add" onSubmit={async e => { e.preventDefault(); if (await act({ action: 'add', ...form })) { setForm({ ...form, name: '', email: '', password: '' }); setAdding(false); } }}>
          <label>Name<input required value={form.name} onChange={sf('name')} /></label>
          <label>Email<input type="email" required value={form.email} onChange={sf('email')} /></label>
          <label>Password<input type="password" minLength={8} required value={form.password} onChange={sf('password')} /></label>
          <label>Role<select value={form.role} onChange={sf('role')}><option>user</option><option>staff</option><option>admin</option></select></label>
          <button className="btn">Create member</button>
        </form>}
        <div className="tools">
          <input placeholder="Search name or email" aria-label="Search members" value={q} onChange={e => setQ(e.target.value)} />
          <select aria-label="Filter by role" value={role} onChange={e => setRole(e.target.value)}><option value="all">All roles</option><option>admin</option><option>staff</option><option>user</option></select>
          <div className="chips">{['All', 'Active', 'Deleted'].map(c => <button key={c} className={c === f ? 'on' : ''} onClick={() => setF(c)}>{c}</button>)}</div>
        </div>
        <div className="card tw">
          <table>
            <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Joined</th><th>Last login</th><th>Password hash</th><th></th></tr></thead>
            <tbody>
              {shown.map(u => (
                <tr key={u.id} className={u.deleted ? 'del' : ''}>
                  <td><div className="who"><div className="mini">{u.name.slice(0, 1)}</div><div><b>{u.name}</b>{u.id === user.id && <span className="badge new">You</span>}<br /><span className="muted">{u.email}</span></div></div></td>
                  <td><select value={u.role} disabled={u.deleted || u.id === user.id} onChange={e => act({ action: 'role', id: u.id, role: e.target.value })}><option>user</option><option>staff</option><option>admin</option></select></td>
                  <td>{u.deleted ? <span className="badge deleted">Deleted</span> : <span><i className="dot" />Active</span>}</td>
                  <td>{fd(u.created_at)}</td>
                  <td>{fd(u.last_login)}</td>
                  <td><Hash h={u.pass_hash} /></td>
                  <td>{u.deleted
                    ? <button className="btn sm" onClick={() => act({ action: 'restore', id: u.id })}>Restore</button>
                    : u.id !== user.id && <button className="btn sm danger" onClick={() => confirm(`Delete ${u.name}?`) && act({ action: 'delete', id: u.id })}>Delete</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && <p className="muted" style={{ paddingTop: '1rem' }}>No members match.</p>}
        </div>
      </>)}

      {tab === 'Backups' && (<>
        <div className="head"><div><h1>Backups</h1><p>Latest 7 are kept.</p></div></div>
        <div className="card">
          <p className="muted" style={{ marginBottom: '1rem' }}>Restoring brings back each member's name, role, password and deleted status from that backup, and re-adds anyone who is missing. Members created later are kept and your own account is left as it is. A fresh backup is saved first, so a restore can be undone.</p>
          {bk.length === 0 && <p className="muted">No backups yet. Use Back up now on the Overview tab.</p>}
          {bk.map(b => <div className="log" key={b.id}><time>{fd(b.at)}</time><span style={{ flex: 1 }}>{b.members} members</span><button className="btn sm" onClick={() => confirm('Restore this backup?') && act({ action: 'restore_backup', id: b.id })}>Restore</button></div>)}
        </div>
      </>)}

      {tab === 'Activity' && (<>
        <div className="head"><div><h1>Activity</h1><p>The 40 most recent events.</p></div></div>
        <div className="card">
          {d.logs.length === 0 && <p className="muted">Nothing yet. Actions will appear here.</p>}
          {d.logs.map((l, i) => <div className="log" key={i}><time>{fd(l.at)}</time><span><b>{l.actor}</b> {l.action} {l.target && <span className="muted">{l.target}</span>}</span></div>)}
        </div>
      </>)}

      {tab === 'Password' && (<><div className="head"><div><h1>Password</h1></div></div><ChangePassword /></>)}
    </Shell>
  );
}
