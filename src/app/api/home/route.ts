import { getSession } from '@/features/identity/server/session';
import { getHomeMembers } from '@/features/members/server/queries';
import { getHomePublications } from '@/features/publications/server/queries';
import { reportServerError } from '@/server/observability/errors';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const section = new URL(request.url).searchParams.get('section');
  if (section !== 'featured' && section !== 'members') return Response.json({ error: 'Invalid section' }, { status: 400, headers });
  try {
    const session = await getSession();
    const authenticated = !!session?.user;
    const data = section === 'featured'
      ? { items: await getHomePublications(authenticated), isAdmin: session?.user?.role === 'ADMIN' }
      : await getHomeMembers();
    return Response.json(data, { headers });
  } catch (error) {
    reportServerError('home.read', error);
    return Response.json({ error: 'Unable to load section' }, { status: 500, headers });
  }
}
