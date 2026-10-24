import { archiveShowcaseAction } from '@/features/publications/server/actions';
import { setPublicationPin, setPublicationVisibility } from '@/features/publications/server/state-commands';
import { beforeAll, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const session = vi.hoisted(() => ({ actor: null as null | { id: string; role: 'ADMIN'; fullName: string; status: 'ACTIVE'; mustChangePassword: boolean } }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => session.actor }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
beforeAll(async () => {
  const user = await prisma.user.create({ data: { fullName: 'Race admin', email: 'state-race@nexus.test', role: 'ADMIN', status: 'ACTIVE' } });
  session.actor = { id: user.id, fullName: user.fullName, role: 'ADMIN', status: 'ACTIVE', mustChangePassword: false };
});
async function create(status: 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED') {
  return prisma.showcaseItem.create({ data: { title: 'Race', slug: crypto.randomUUID(), summary: '', status, creatorId: session.actor!.id } });
}
it('never pins archived publications', async () => {
  const item = await create('ARCHIVED');
  expect(await setPublicationPin(session.actor!, { itemId: item.id, enabled: true })).toMatchObject({ success: false });
  expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: item.id } })).isPinned).toBe(false);
});
it('keeps archive and pin transitions consistent under concurrent transactions', async () => {
  const item = await create();
  await Promise.allSettled([setPublicationPin(session.actor!, { itemId: item.id, enabled: true }), archiveShowcaseAction(item.id)]);
  let saved = await prisma.showcaseItem.findUniqueOrThrow({ where: { id: item.id } });
  if (saved.status !== 'ARCHIVED') expect((await archiveShowcaseAction(item.id)).success).toBe(true);
  saved = await prisma.showcaseItem.findUniqueOrThrow({ where: { id: item.id } });
  expect(saved).toMatchObject({ status: 'ARCHIVED', isPinned: false, pinnedAt: null });
});
it('bounds four competing pin requests and keeps repeated visibility commands idempotent', async () => {
  const items = await Promise.all(Array.from({ length: 4 }, () => create()));
  await Promise.all(items.map(item => setPublicationPin(session.actor!, { itemId: item.id, enabled: true })));
  expect(await prisma.showcaseItem.count({ where: { isPinned: true } })).toBeLessThanOrEqual(3);
  for (let run = 0; run < 2; run++) expect(await setPublicationVisibility(session.actor!, { itemId: items[0].id, visibility: 'PUBLIC' })).toMatchObject({ success: true });
  expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: items[0].id } })).visibility).toBe('PUBLIC');
});
