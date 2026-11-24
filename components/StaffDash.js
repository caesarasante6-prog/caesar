'use client';
import { useState, useEffect, useCallback } from 'react';
import Shell from './Shell';
import ChangePassword from './ChangePassword';
import { fd, H } from './util';

const WEEK = 6048e5;

export default function StaffDash({ user }) {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('Users');
  const load = useCallback(async () => { const r = await fetch('/api/staff'); if (r.ok) setUsers((await r.json()).users); }, []);
  useEffect(() => { load(); }, [load]);

  async function del(u) {
    if (!confirm(`Delete ${u.name}? Only an admin can restore them.`)) return;
    const r = await fetch('/api/staff', { method: 'POST', headers: H, body: JSON.stringify({ id: u.id }) });
    const j = await r.json();
    setToast(j.message || j.error); setTimeout(() => setToast(''), 3500);
    load();
  }

  const isNew = u => Date.now() - new Date(u.created_at) < WEEK;
  const week = users.filter(isNew).length;
  const never = users.filter(u => !u.last_login).length;
  const list = users
    .filter(u => (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name)
      : sort === 'login' ? new Date(b.last_login || 0) - new Date(a.last_login || 0)
      : new Date(b.created_at) - new Date(a.created_at));

  return (
    <Shell user={user} tabs={['Users', 'Password']} tab={tab} setTab={setTab} toast={toast}>
      {tab === 'Password' ? (<><div className="head"><div><h1>Password</h1></div></div><ChangePassword /></>) : (<>
        <div className="head"><div><h1>Staff workspace</h1><p>Manage member accounts. Deleted users can only be restored by an admin.</p></div></div>
        <div className="stats">
          <div className="stat"><b>{users.length}</b><span>Active users</span></div>
          <div className="stat"><b>{week}</b><span>Joined this week</span></div>
          <div className="stat"><b>{never}</b><span>Never signed in</span></div>
        </div>
        <div className="tools">
          <input placeholder="Search name or email" aria-label="Search users" value={q} onChange={e => setQ(e.target.value)} />
          <select aria-label="Sort users" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="new">Newest first</option><option value="name">Name A to Z</option><option value="login">Recent sign-in</option>
          </select>
        </div>
        <div className="card tw">
          <table>
            <thead><tr><th>User</th><th>Joined</th><th>Last sign-in</th><th></th></tr></thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td><div className="who"><div className="mini">{u.name.slice(0, 1)}</div><div><b>{u.name}</b>{isNew(u) && <span className="badge new">New</span>}{!u.last_login && <span className="badge warn">Not signed in yet</span>}<br /><span className="muted">{u.email}</span></div></div></td>
                  <td>{fd(u.created_at)}</td><td>{fd(u.last_login)}</td>
                  <td><button className="btn sm danger" onClick={() => del(u)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="muted" style={{ paddingTop: '1rem' }}>No users found.</p>}
        </div>
      </>)}
    </Shell>
  );
}
