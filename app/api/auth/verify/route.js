import { sql, init } from '@/lib/db';
import { setSession, sha, log } from '@/lib/auth';

export async function POST(req) {
  await init();
  const { email, code } = await req.json();
  const e = (email || '').trim().toLowerCase();
  const fail = () => Response.json({ error: 'That code is wrong or has expired.' }, { status: 401 });
  const [u] = await sql`SELECT * FROM users WHERE email=${e} AND deleted=false`;
  if (!u) return fail();
  const [c] = await sql`SELECT * FROM codes WHERE user_id=${u.id}`;
  if (!c || new Date(c.expires) < new Date()) return fail();
  if (c.hash !== sha(String(code || '').trim())) {
    if (c.tries + 1 >= 5) await sql`DELETE FROM codes WHERE user_id=${u.id}`;
    else await sql`UPDATE codes SET tries=tries+1 WHERE user_id=${u.id}`;
    return fail();
  }
  await sql`DELETE FROM codes WHERE user_id=${u.id}`;
  await sql`UPDATE users SET last_login=now() WHERE id=${u.id}`;
  await setSession(u);
  await log(u.email, 'logged in');
  return Response.json({ ok: true });
}
