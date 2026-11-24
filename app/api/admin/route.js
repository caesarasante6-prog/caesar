import { sql } from '@/lib/db';
import { getUser, hashPassword, log } from '@/lib/auth';
import { runBackup, restoreBackup } from '@/lib/backup';

const ROLES = ['admin', 'staff', 'user'];
const no = () => Response.json({ error: 'Not allowed.' }, { status: 403 });
const err = (m, s = 400) => Response.json({ error: m }, { status: s });

export async function GET(req) {
  if (!(await getUser(['admin']))) return no();
  if (new URL(req.url).searchParams.get('backups')) {
    const backups = await sql`SELECT id, at, jsonb_array_length(data->'users') AS members FROM backups ORDER BY id DESC`;
    return Response.json({ backups });
  }
  const users = await sql`SELECT id,name,email,pass_hash,role,deleted,deleted_at,last_login,created_at FROM users ORDER BY id`;
  const logs = await sql`SELECT actor,action,target,at FROM logs ORDER BY id DESC LIMIT 40`;
  const [lb] = await sql`SELECT max(at) AS at FROM backups`;
  return Response.json({ users, logs, lastBackup: lb?.at || null });
}

export async function POST(req) {
  const a = await getUser(['admin']);
  if (!a) return no();
  const b = await req.json();

  if (b.action === 'backup') {
    await runBackup();
    await log(a.email, 'ran a backup');
    return Response.json({ message: 'Backup completed' });
  }

  if (b.action === 'add') {
    const e = (b.email || '').trim().toLowerCase();
    if (!b.name?.trim() || !/^\S+@\S+\.\S+$/.test(e) || (b.password || '').length < 8 || !ROLES.includes(b.role))
      return err('Fill in every field. The password needs 8 or more characters.');
    const [x] = await sql`SELECT id FROM users WHERE email=${e}`;
    if (x) return err('That email already exists.', 409);
    await sql`INSERT INTO users(name,email,pass_hash,role) VALUES(${b.name.trim()},${e},${await hashPassword(b.password)},${b.role})`;
    await log(a.email, `added a member as ${b.role}`, e);
    return Response.json({ message: `${b.name.trim()} added as ${b.role}` });
  }

  if (b.action === 'restore_backup') {
    const n = await restoreBackup(Number(b.id), a.email);
    if (n === null) return err('Backup not found.', 404);
    await log(a.email, `restored backup #${Number(b.id)}`);
    return Response.json({ message: `Backup restored (${n} members checked)` });
  }

  const id = Number(b.id);
  const [t] = await sql`SELECT email FROM users WHERE id=${id}`;
  if (!t) return err('Member not found.', 404);
  if (b.action !== 'restore' && id === a.id) return err('You cannot change or delete your own account.');

  if (b.action === 'role') {
    if (!ROLES.includes(b.role)) return err('Unknown role.');
    await sql`UPDATE users SET role=${b.role} WHERE id=${id}`;
    await log(a.email, `changed role to ${b.role}`, t.email);
    return Response.json({ message: `Role changed to ${b.role}` });
  }
  if (b.action === 'delete') {
    await sql`UPDATE users SET deleted=true, deleted_at=now(), deleted_by=${a.email} WHERE id=${id}`;
    await log(a.email, 'deleted account', t.email);
    return Response.json({ message: 'Account deleted. You can restore it any time.' });
  }
  if (b.action === 'restore') {
    await sql`UPDATE users SET deleted=false, deleted_at=null, deleted_by=null, failed=0, locked_until=null WHERE id=${id}`;
    await log(a.email, 'restored account', t.email);
    return Response.json({ message: 'Account restored' });
  }
  return err('Unknown action.');
}
