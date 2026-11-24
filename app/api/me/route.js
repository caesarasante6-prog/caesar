import { sql } from '@/lib/db';
import { getUser, log } from '@/lib/auth';

export async function POST(req) {
  const u = await getUser();
  if (!u) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
  const n = ((await req.json()).name || '').trim();
  if (n.length < 2 || n.length > 60) return Response.json({ error: 'Enter a name between 2 and 60 characters.' }, { status: 400 });
  await sql`UPDATE users SET name=${n} WHERE id=${u.id}`;
  await log(u.email, 'updated profile name');
  return Response.json({ message: 'Profile updated' });
}
