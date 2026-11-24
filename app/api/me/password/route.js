import { sql } from '@/lib/db';
import { getUser, checkPassword, hashPassword, log } from '@/lib/auth';

export async function POST(req) {
  const u = await getUser();
  if (!u) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
  const { current, next } = await req.json();
  if ((next || '').length < 8) return Response.json({ error: 'The new password needs 8 or more characters.' }, { status: 400 });
  const [r] = await sql`SELECT pass_hash FROM users WHERE id=${u.id}`;
  if (!(await checkPassword(current || '', r.pass_hash)))
    return Response.json({ error: 'Your current password is incorrect.' }, { status: 400 });
  await sql`UPDATE users SET pass_hash=${await hashPassword(next)} WHERE id=${u.id}`;
  await log(u.email, 'changed password');
  return Response.json({ message: 'Password changed' });
}
