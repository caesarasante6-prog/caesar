import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql, init } from './db';

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

// PEPPER: secret from env, mixed in with HMAC before hashing.
// SALT: bcrypt generates a unique random salt per password and stores it inside the hash.
const peppered = (pw) => crypto.createHmac('sha256', process.env.PEPPER).update(pw).digest('base64');
export const hashPassword = (pw) => bcrypt.hash(peppered(pw), 12);
export const checkPassword = (pw, hash) => bcrypt.compare(peppered(pw), hash);
export const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

export async function setSession(u) {
  const t = await new SignJWT({ id: u.id }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('8h').sign(key());
  (await cookies()).set('caesar', t, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 28800,
    secure: process.env.NODE_ENV === 'production',
  });
}

// Re-reads the user from the database every time, so role changes and deletions apply immediately.
export async function getUser(roles) {
  try {
    const t = (await cookies()).get('caesar')?.value;
    if (!t) return null;
    const { payload } = await jwtVerify(t, key());
    await init();
    const [u] = await sql`SELECT id,name,email,role,last_login,created_at FROM users WHERE id=${payload.id} AND deleted=false`;
    if (!u || (roles && !roles.includes(u.role))) return null;
    return u;
  } catch { return null; }
}

export const log = (actor, action, target = '') =>
  sql`INSERT INTO logs(actor,action,target) VALUES(${actor},${action},${target})`;

export async function sendCode(email, code) {
  const subject = `Your CAESAR code: ${code}`;
  const html = `<div style="font-family:Arial,sans-serif;background:#0c0b09;padding:32px;color:#f3eee0"><h2 style="color:#e8c25e;letter-spacing:3px">CAESAR</h2><p>Your verification code is</p><p style="font-size:34px;letter-spacing:8px;color:#e8c25e;font-weight:bold">${code}</p><p style="color:#a39d89">It expires in 10 minutes. If this was not you, ignore this email.</p></div>`;
  // Option 1: SMTP (for example Gmail). Delivers to any email address, no domain needed.
  if (process.env.SMTP_USER) {
    const { default: nodemailer } = await import('nodemailer');
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: email, subject, html });
    return;
  }
  // Option 2: Resend (needs a verified domain to email anyone other than yourself)
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: email, subject, html }),
  });
  if (!r.ok) throw new Error('mail');
}
