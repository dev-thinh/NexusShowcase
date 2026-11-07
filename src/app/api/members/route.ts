import { getSession } from '@/features/identity/server/session';
import { memberDirectoryRequestSchema, MEMBER_DIRECTORY_PAGE_SIZE } from '@/features/members/model/directory-page';
import { listDirectory } from '@/features/members/server/queries';
import { reportServerError } from '@/server/observability/errors';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  const parsed = memberDirectoryRequestSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: 'Invalid member directory request' }, { status: 400, headers });
  try {
    const session = await getSession();
    return Response.json(await listDirectory({ authenticated: !!session?.user, ...parsed.data, pageSize: MEMBER_DIRECTORY_PAGE_SIZE }), { headers });
  } catch (error) {
    reportServerError('members.directory', error);
    return Response.json({ error: 'Unable to load members' }, { status: 500, headers });
  }
}
