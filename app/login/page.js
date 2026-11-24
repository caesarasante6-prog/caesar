'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const r = useRouter();
  const [step, setStep] = useState('pw');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const url = step === 'pw' ? '/api/auth/login' : '/api/auth/verify';
    const body = step === 'pw' ? { email, password: pw } : { email, code };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json(); setBusy(false);
    if (!res.ok) return setErr(j.error);
    if (step === 'pw') setStep('code'); else { r.push('/dashboard'); r.refresh(); }
  }

  return (
    <div className="auth">
      <aside className="pillar"><Link className="brand" href="/">CAESAR</Link><h2>Welcome back to the organisation.</h2></aside>
      <section>
        <form onSubmit={submit}>
          <h1>{step === 'pw' ? 'Sign in' : 'Check your email'}</h1>
          {step === 'pw' ? (<>
            <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
            <label>Password<input type="password" required value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" /></label>
          </>) : (<>
            <p>We sent a 6-digit code to {email}. It expires in 10 minutes.</p>
            <label>Verification code<input inputMode="numeric" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" /></label>
          </>)}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Please wait' : step === 'pw' ? 'Send my code' : 'Verify and sign in'}</button>
          {step === 'pw' && <p>New here? <Link href="/register"><b>Create an account</b></Link></p>}
        </form>
      </section>
    </div>
  );
}
