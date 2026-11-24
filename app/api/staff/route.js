import { sql } from '@/lib/db';
import { getUser, log } from '@/lib/auth';

const no = () => Response.json({ error: 'Not allowed.' }, { status: 403 });

export async function GET() {
  if (!(await getUser(['staff', 'admin']))) return no();
  const users = await sql`SELECT id,name,email,last_login,created_at FROM users WHERE role='user' AND deleted=false ORDER BY id DESC`;
  return Response.json({ users });
}

export async function POST(req) {
  const s = await getUser(['staff']);
  if (!s) return no();
  const { id } = await req.json();
  const [t] = await sql`SELECT email FROM users WHERE id=${Number(id)} AND role='user' AND deleted=false`;
  if (!t) return Response.json({ error: 'Staff can only delete active users.' }, { status: 404 });
  await sql`UPDATE users SET deleted=true, deleted_at=now(), deleted_by=${s.email} WHERE id=${Number(id)}`;
  await log(s.email, 'deleted account', t.email);
  return Response.json({ message: 'User deleted' });
}
