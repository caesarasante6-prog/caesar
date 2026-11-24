import { neon } from '@neondatabase/serverless';

// Lazy so the build works before env vars are read
export const sql = (...a) => neon(process.env.DATABASE_URL)(...a);

let ready;
export function init() {
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      pass_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
      deleted BOOLEAN NOT NULL DEFAULT false, deleted_at TIMESTAMPTZ, deleted_by TEXT,
      failed INT NOT NULL DEFAULT 0, locked_until TIMESTAMPTZ, last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS codes (
      user_id INT PRIMARY KEY, hash TEXT NOT NULL, expires TIMESTAMPTZ NOT NULL, tries INT NOT NULL DEFAULT 0)`;
    await sql`CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY, actor TEXT, action TEXT, target TEXT DEFAULT '', at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS backups (
      id SERIAL PRIMARY KEY, data JSONB NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  })();
  return ready;
}
