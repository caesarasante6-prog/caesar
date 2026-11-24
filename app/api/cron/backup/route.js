import { runBackup } from '@/lib/backup';

export async function GET(req) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response('Unauthorized', { status: 401 });
  await runBackup();
  return Response.json({ ok: true });
}
