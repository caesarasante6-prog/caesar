import { sql, init } from './db';

// Snapshots users + activity log into the backups table and keeps the latest 7.
export async function runBackup() {
  await init();
  const users = await sql`SELECT * FROM users`;
  const logs = await sql`SELECT * FROM logs`;
  await sql`INSERT INTO backups(data) VALUES(${JSON.stringify({ users, logs })}::jsonb)`;
  await sql`DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY id DESC LIMIT 7)`;
}

// Restores members from a saved backup without wiping anything newer.
// A safety backup is taken first so a restore can be undone. skipEmail (the acting admin) is left untouched.
export async function restoreBackup(id, skipEmail) {
  await init();
  const [b] = await sql`SELECT data FROM backups WHERE id=${id}`;
  if (!b) return null;
  await runBackup();
  let n = 0;
  for (const u of b.data.users) {
    if (u.email === skipEmail) continue;
    await sql`INSERT INTO users(name,email,pass_hash,role,deleted,deleted_at,deleted_by,last_login,created_at)
      VALUES(${u.name},${u.email},${u.pass_hash},${u.role},${u.deleted},${u.deleted_at},${u.deleted_by},${u.last_login},${u.created_at})
      ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, pass_hash=EXCLUDED.pass_hash, role=EXCLUDED.role,
        deleted=EXCLUDED.deleted, deleted_at=EXCLUDED.deleted_at, deleted_by=EXCLUDED.deleted_by`;
    n++;
  }
  return n;
}
