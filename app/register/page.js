'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const r = useRouter();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const j = await res.json(); setBusy(false);
    if (!res.ok) return setErr(j.error);
    r.push('/login');
  }

  return (
    <div className="auth">
      <aside className="pillar"><Link className="brand" href="/">CAESAR</Link><h2>Create your member account.</h2></aside>
      <section>
        <form onSubmit={submit}>
          <h1>Create account</h1>
          <label>Full name<input required value={f.name} onChange={set('name')} autoComplete="name" /></label>
          <label>Email<input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
          <p style={{ fontSize: '.85rem' }}>Your sign-in codes are sent to this email, so use one you can open.</p>
          <label>Password (8+ characters)<input type="password" minLength={8} required value={f.password} onChange={set('password')} autoComplete="new-password" /></label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Creating account' : 'Create account'}</button>
          <p>Already a member? <Link href="/login"><b>Sign in</b></Link></p>
        </form>
      </section>
    </div>
  );
}
