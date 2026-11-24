import { sql, init } from '@/lib/db';
import { hashPassword, log } from '@/lib/auth';

export async function POST(req) {
  await init();
  const { name, email, password } = await req.json();
  const e = (email || '').trim().toLowerCase();
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(e) || (password || '').length < 8)
    return Response.json({ error: 'Enter your name, a valid email and a password of at least 8 characters.' }, { status: 400 });
  const [x] = await sql`SELECT id FROM users WHERE email=${e}`;
  if (x) return Response.json({ error: 'That email is already registered.' }, { status: 409 });
  const role = e === (process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'user';
  await sql`INSERT INTO users(name,email,pass_hash,role) VALUES(${name.trim()},${e},${await hashPassword(password)},${role})`;
  await log(e, 'registered');
  return Response.json({ ok: true });
}
