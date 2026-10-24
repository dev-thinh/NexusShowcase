import MemberProfilePage from '@/app/(shell)/(site)/members/[id]/page';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const session = vi.hoisted(() => ({ authenticated: false }));
vi.mock('@/features/identity/server/session', () => ({ getSession: async () => session.authenticated ? { user: { id: 'viewer', role: 'MEMBER' } } : null }));
vi.mock('@/app/(shell)/_components/navbar', () => ({ Navbar: () => null }));
vi.mock('@/shared/ui/academic-footer', () => ({ AcademicFooter: () => null }));

describe('real member profile visibility boundary', () => {
  let userId: string;
  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: 'boundary@nexus.test', fullName: 'Public author', role: 'MEMBER', status: 'ACTIVE', studentId: 'secret-student', passwordHash: 'secret-hash' } });
    userId = user.id;
    for (const [slug, status, visibility] of [['visible-title', 'PUBLISHED', 'PUBLIC'], ['private-title', 'PUBLISHED', 'PRIVATE'], ['draft-title', 'DRAFT', 'PUBLIC']] as const) {
      await prisma.showcaseItem.create({ data: { title: slug, slug, summary: 'Summary', content: 'secret-content', authorDraft: { secret: 'secret-draft' }, status, visibility, creatorId: user.id, contributors: { create: { userId: user.id, role: 'CO_AUTHOR' } } } });
    }
  });
  it('renders only PUBLIC published contributions for guests', async () => {
    session.authenticated = false;
    const html = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: userId }) }));
    expect(html).toContain('visible-title');
    expect(html).not.toContain('private-title');
    expect(html).not.toContain('draft-title');
    expect(html).not.toContain('secret-');
  });
  it('allows authenticated members to see internal published contributions', async () => {
    session.authenticated = true;
    const html = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: userId }) }));
    expect(html).toContain('private-title');
    expect(html).not.toContain('draft-title');
    expect(html).not.toContain('secret-');
  });
});
