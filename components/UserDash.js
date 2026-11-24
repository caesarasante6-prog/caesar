'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Shell from './Shell';
import ChangePassword from './ChangePassword';
import { fd, H } from './util';

const MAXIMS = [
  ['We suffer more often in imagination than in reality.', 'Seneca'],
  ['Fortune favours the bold.', 'Virgil'],
  ['While we wait for life, life passes.', 'Seneca'],
  ['Well begun is half done.', 'Horace'],
  ['The impediment to action advances action.', 'Marcus Aurelius'],
  ['Dare to be wise.', 'Horace'],
  ['Waste no more time arguing what a good person should be. Be one.', 'Marcus Aurelius'],
];
const NEWS = [
  ['Welcome to CAESAR', 'Your account is protected by a salted and peppered password and an emailed sign-in code.'],
  ['Staying secure', 'Never share your verification code. CAESAR staff will never ask for it.'],
];

export default function UserDash({ user, logs }) {
  const r = useRouter();
  const [tab, setTab] = useState('Home');
  const [hi, setHi] = useState('Welcome');
  const [m, setM] = useState(MAXIMS[0]);
  const [name, setName] = useState(user.name);
  const [toast, setToast] = useState('');
  useEffect(() => {
    const h = new Date().getHours();
    setHi(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    setM(MAXIMS[Math.floor(Date.now() / 864e5) % MAXIMS.length]);
  }, []);
  const days = Math.max(1, Math.ceil((Date.now() - new Date(user.created_at)) / 864e5));

  async function save(e) {
    e.preventDefault();
    const res = await fetch('/api/me', { method: 'POST', headers: H, body: JSON.stringify({ name }) });
    const j = await res.json();
    setToast(j.message || j.error); setTimeout(() => setToast(''), 3500);
    if (res.ok) r.refresh();
  }

  return (
    <Shell user={user} tabs={['Home', 'Profile', 'Security']} tab={tab} setTab={setTab} toast={toast}>
      {tab === 'Home' && (<>
        <div className="banner pillar"><h1>{hi}, <em>{user.name.split(' ')[0]}</em>.</h1><p>Glad to see you. Here is your space in the organisation.</p></div>
        <div className="stats">
          <div className="stat"><b>{days}</b><span>{days === 1 ? 'Day' : 'Days'} as a member</span></div>
          <div className="stat"><b>Strong</b><span>Account protection</span></div>
          <div className="stat"><b style={{ fontSize: '1.15rem', paddingTop: '.9rem' }}>{fd(user.last_login)}</b><span>This session started</span></div>
        </div>
        <div className="card"><h3>Quick actions</h3>
          <div className="quick">
            <button onClick={() => setTab('Profile')}>Edit profile<span>Update your name</span></button>
            <button onClick={() => setTab('Security')}>Change password<span>Keep your account safe</span></button>
            <button onClick={() => setTab('Security')}>Security check<span>See how you are protected</span></button>
          </div>
        </div>
        <div className="two">
          <div className="card"><h3>Thought for today</h3><blockquote>{m[0]}</blockquote><p className="muted" style={{ marginTop: '.6rem' }}>{m[1]}</p></div>
          <div className="card"><h3>Announcements</h3>{NEWS.map(n => <div key={n[0]} style={{ marginBottom: '.8rem' }}><b>{n[0]}</b><p className="muted">{n[1]}</p></div>)}</div>
        </div>
        <div className="card"><h3>Your recent activity</h3>
          {logs.length === 0 && <p className="muted">Your sign-ins and account events will show up here.</p>}
          {logs.map((l, i) => <div className="log" key={i}><time>{fd(l.at)}</time><span>{l.action}</span></div>)}
        </div>
      </>)}

      {tab === 'Profile' && (<>
        <div className="head"><div><h1>Your profile</h1><p>How you appear in the organisation.</p></div></div>
        <div className="card">
          <div className="profile">
            <div className="av big">{user.name.slice(0, 1)}</div>
            <div><h2>{user.name}<span className="badge user" style={{ marginLeft: '.6rem' }}>{user.role}</span></h2><p className="muted">{user.email}</p><p className="muted">Member since {fd(user.created_at)}</p></div>
          </div>
          <form onSubmit={save} style={{ maxWidth: 380, display: 'grid', gap: '1rem' }}>
            <label>Display name<input required minLength={2} maxLength={60} value={name} onChange={e => setName(e.target.value)} /></label>
            <button className="btn">Save profile</button>
          </form>
        </div>
      </>)}

      {tab === 'Security' && (<>
        <div className="head"><div><h1>Your security</h1><p>How CAESAR protects your account.</p></div></div>
        <div className="card">
          <div className="check"><i>✓</i><span>Two-step sign-in is on. A code is emailed to {user.email} each time you sign in.</span></div>
          <div className="check"><i>✓</i><span>Your password is stored as a salted and peppered hash, never as plain text.</span></div>
          <div className="check"><i>✓</i><span>Your account locks for 15 minutes after 5 wrong passwords.</span></div>
        </div>
        <ChangePassword />
      </>)}
    </Shell>
  );
}
