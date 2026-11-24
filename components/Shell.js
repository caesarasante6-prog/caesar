'use client';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Shell({ user, tabs, tab, setTab, toast, children }) {
  const r = useRouter();
  const out = async () => { await fetch('/api/auth/logout', { method: 'POST' }); r.push('/login'); r.refresh(); };
  return (
    <div className="app">
      <aside>
        <div className="brand side-brand">CAESAR</div>
        <nav>{tabs.map(t => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>
        <div className="me">
          <div className="av">{user.name.slice(0, 1)}</div>
          <div><b>{user.name}</b><span className={`badge ${user.role}`}>{user.role}</span></div>
        </div>
        <ThemeToggle />
        <button className="out" onClick={out}>Sign out</button>
      </aside>
      <main>{children}</main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
