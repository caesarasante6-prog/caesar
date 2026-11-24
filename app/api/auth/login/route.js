import crypto from 'crypto';
import { sql, init } from '@/lib/db';
import { checkPassword, sendCode, sha, log } from '@/lib/auth';

export async function POST(req) {
  await init();
  const { email, password } = await req.json();
  const e = (email || '').trim().toLowerCase();
  const bad = () => Response.json({ error: 'Incorrect email or password.' }, { status: 401 });
  const [u] = await sql`SELECT * FROM users WHERE email=${e} AND deleted=false`;
  if (!u) return bad();
  if (u.locked_until && new Date(u.locked_until) > new Date())
    return Response.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 });
  if (!(await checkPassword(password || '', u.pass_hash))) {
    const f = u.failed + 1, lock = f >= 5;
    await sql`UPDATE users SET failed=${lock ? 0 : f}, locked_until=${lock ? new Date(Date.now() + 900000).toISOString() : null} WHERE id=${u.id}`;
    if (lock) await log(e, 'account locked');
    return bad();
  }
  await sql`UPDATE users SET failed=0 WHERE id=${u.id}`;
  const code = String(crypto.randomInt(100000, 1000000));
  await sql`DELETE FROM codes WHERE user_id=${u.id}`;
  await sql`INSERT INTO codes(user_id,hash,expires) VALUES(${u.id},${sha(code)},${new Date(Date.now() + 600000).toISOString()})`;
  try { await sendCode(u.email, code); }
  catch { return Response.json({ error: 'Could not send the code email. Check the email settings.' }, { status: 500 }); }
  return Response.json({ step: 'code' });
}
