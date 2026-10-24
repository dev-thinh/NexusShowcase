import { setShowcasePinAction } from '@/features/publications/server/actions';
import type { User } from '@prisma/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma, withTestFixtures } from '../fixtures/database';

const session = vi.hoisted(() => ({ actor: null as User | null }));
vi.mock('@/features/identity/server/actor', () => ({
  getActor: async (roles?: string[]) => session.actor && (!roles || roles.includes(session.actor.role)) ? session.actor : null,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
let admin: User, member: User;
beforeAll(async () => {
  admin = await prisma.user.create({ data: { fullName: 'Pin admin', email: 'pin-admin@nexus.test', role: 'ADMIN', status: 'ACTIVE' } });
  member = await prisma.user.create({ data: { fullName: 'Pin member', email: 'pin-member@nexus.test', role: 'MEMBER', status: 'ACTIVE' } });
});
afterEach(async () => { await prisma.showcaseItem.deleteMany({ where: { creatorId: admin.id } }); });
async function item(pinned = false, status: 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED') {
  return prisma.showcaseItem.create({ data: {
    title: 'Pin fixture', slug: crypto.randomUUID(), summary: 'Pin contract', creatorId: admin.id,
    status, isPinned: pinned, pinnedAt: pinned ? new Date() : null,
  } });
}

describe('three-pin capacity and explicit replacement', () => {
  it('denies member pinning and replacement without changing either item', async () => {
    const old = await item(true), candidate = await item();
    session.actor = member;
    expect((await setShowcasePinAction({ itemId: candidate.id, enabled: true })).success).toBe(false);
    expect((await setShowcasePinAction({ itemId: candidate.id, enabled: true, replaceItemIds: [old.id] })).success).toBe(false);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: candidate.id } })).isPinned).toBe(false);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: old.id } })).isPinned).toBe(true);
  });
  it('allows admin pin and unpin and rejects archived articles', async () => {
    session.actor = admin;
    const candidate = await item();
    expect(await setShowcasePinAction({ itemId: candidate.id, enabled: true })).toMatchObject({ success: true, data: { isPinned: true } });
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: candidate.id } })).pinnedAt).not.toBeNull();
    expect(await setShowcasePinAction({ itemId: candidate.id, enabled: false })).toMatchObject({ success: true, data: { isPinned: false } });
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: candidate.id } })).pinnedAt).toBeNull();
    expect((await setShowcasePinAction({ itemId: (await item(false, 'ARCHIVED')).id, enabled: true })).success).toBe(false);
  });
  it('requires a chosen replacement for the fourth pin and preserves all other pins', async () => {
    session.actor = admin;
    const old = await Promise.all([item(true), item(true), item(true)]);
    const candidate = await item();
    expect(await setShowcasePinAction({ itemId: candidate.id, enabled: true })).toMatchObject({ success: false, details: { requiresReplacement: true } });
    expect(await prisma.showcaseItem.count({ where: { isPinned: true } })).toBe(3);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: candidate.id } })).isPinned).toBe(false);
    expect((await setShowcasePinAction({ itemId: candidate.id, enabled: true, replaceItemIds: [old[1].id] })).success).toBe(true);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: old[1].id } })).isPinned).toBe(false);
    for (const id of [old[0].id, old[2].id, candidate.id]) {
      expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).isPinned).toBe(true);
    }
    expect(await prisma.showcaseItem.count({ where: { isPinned: true } })).toBe(3);
  });
  it('does not exceed three pins under simultaneous requests', async () => {
    session.actor = admin;
    await Promise.all([item(true), item(true)]);
    const candidates = await Promise.all([item(), item()]);
    const results = await Promise.all(candidates.map(candidate => setShowcasePinAction({ itemId: candidate.id, enabled: true })));
    expect(results.filter(result => result.success)).toHaveLength(1);
    expect(await prisma.showcaseItem.count({ where: { isPinned: true } })).toBe(3);
  });
  it('cleans one fixture without changing pins in another fixture', async () => {
    const survivor = await item(true);
    let cleanedSchema = '';
    await withTestFixtures(async isolated => {
      cleanedSchema = isolated.prefix;
      const owner = await isolated.prisma.user.create({ data: { fullName: 'Nested fixture', email: isolated.prefix + '@nexus.test' } });
      await isolated.prisma.showcaseItem.create({ data: { title: 'Owned', slug: isolated.prefix, summary: '', creatorId: owner.id, status: 'PUBLISHED', isPinned: true } });
      expect(await isolated.prisma.showcaseItem.count({ where: { isPinned: true } })).toBe(1);
      expect(await prisma.showcaseItem.count({ where: { isPinned: true } })).toBe(1);
    });
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: survivor.id } })).isPinned).toBe(true);
    const remaining = await prisma.$queryRaw<Array<{ present: boolean }>>`SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = ${cleanedSchema}) AS present`;
    expect(remaining[0].present).toBe(false);
  });
});
