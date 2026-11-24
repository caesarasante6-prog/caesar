import { cookies } from 'next/headers';
export async function POST() {
  (await cookies()).delete('caesar');
  return Response.json({ ok: true });
}
