import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import AdminDash from '@/components/AdminDash';
import StaffDash from '@/components/StaffDash';
import UserDash from '@/components/UserDash';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const u = await getUser();
  if (!u) redirect('/login');
  if (u.role === 'admin') return <AdminDash user={u} />;
  if (u.role === 'staff') return <StaffDash user={u} />;
  const logs = await sql`SELECT action,at FROM logs WHERE actor=${u.email} ORDER BY id DESC LIMIT 5`;
  return <UserDash user={u} logs={logs} />;
}
