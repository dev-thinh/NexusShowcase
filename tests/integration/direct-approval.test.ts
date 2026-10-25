import { archiveShowcaseAction, reopenShowcaseAction } from '@/features/publications/server/actions';
import { decideSubmissionAction } from '@/features/review/server/actions';
import { articleFromLegacy, serializeArticle } from '@/features/submissions/model/article';
import { saveShowcaseDraftAction, submitShowcaseForReviewAction, withdrawSubmissionAction } from '@/features/submissions/server/actions';
import type { Role } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';

const session = vi.hoisted(() => ({ actor: null as null | { id: string; fullName: string; role: Role; status: 'ACTIVE' } }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async (roles?: Role[]) => session.actor && (!roles || roles.includes(session.actor.role)) ? session.actor : null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

let author: NonNullable<typeof session.actor>, admin: NonNullable<typeof session.actor>;
let categoryId: string;
const items: string[] = [];
const createdCategories: string[] = [];
const userIds: string[] = [];
const payload = () => ({ title: 'Robot thử nghiệm', summary: 'Abstract bắt buộc', categoryId, type: 'PROJECT' as const, contributors: [{ userId: author.id, role: 'CONTRIBUTOR' as const, displayOrder: 0 }], resources: [], content: serializeArticle(articleFromLegacy('Kết quả **thử nghiệm**', [{ kind: 'LINK', label: 'Mã nguồn', url: 'https://github.com/lab/robot', linkType: 'GITHUB' }])) });
async function saveDraft(itemId: string | null, draft: unknown) {
  const version = itemId ? (await prisma.showcaseItem.findUniqueOrThrow({ where: { id: itemId } })).reviewVersion : undefined;
  return saveShowcaseDraftAction({ itemId, expectedReviewVersion: version, draft });
}
async function submitDraft(itemId: string) {
  const { reviewVersion } = await prisma.showcaseItem.findUniqueOrThrow({ where: { id: itemId } });
  return submitShowcaseForReviewAction({ itemId, expectedReviewVersion: reviewVersion });
}
async function draft() {
  session.actor = author;
  const saved = await saveDraft(null, payload());
  if (!saved.success) throw Error(saved.error);
  items.push(saved.data.id);
  return saved.data.id;
}
async function publish(id: string) {
  const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
  session.actor = admin;
  return decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'PUBLISH', visibility: 'PUBLIC' });
}
beforeAll(async () => {
  const suffix = crypto.randomUUID();
  for (const role of ['CORE_MEMBER', 'ADMIN'] as const) {
    const user = await prisma.user.create({ data: { email: `${role}-${suffix}@nexus.test`, fullName: role, role, status: 'ACTIVE' } });
    userIds.push(user.id);
    const value = { id: user.id, fullName: user.fullName, role, status: 'ACTIVE' as const };
    if (role === 'ADMIN') admin = value; else author = value;
  }
  let category = await prisma.category.findUnique({ where: { slug: 'robotics-iot' } });
  if (!category) { category = await prisma.category.create({ data: { name: 'Robotics test', slug: 'robotics-iot' } }); createdCategories.push(category.id); }
  categoryId = category.id;
});
afterAll(async () => {
  await prisma.showcaseItem.deleteMany({ where: { id: { in: items } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.category.deleteMany({ where: { id: { in: createdCategories } } });
});

describe('author sections and direct admin approval', () => {
  it('preserves immutable resubmission history through direct admin revision and publication', async () => {
    const id = await draft();
    await submitDraft(id);
    const pending = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: pending.reviewVersion, action: 'REQUEST_REVISION', reason: 'Clarify results.' })).success).toBe(true);
    session.actor = author;
    expect((await saveDraft(id, { ...payload(), summary: 'Clarified immutable submission' })).success).toBe(true);
    expect((await submitDraft(id)).success).toBe(true);
    const resubmitted = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: resubmitted.reviewVersion, action: 'PUBLISH', visibility: 'PRIVATE' })).success).toBe(true);
    const revisions = await prisma.submissionRevision.findMany({ where: { itemId: id }, orderBy: { revisionNumber: 'asc' } });
    expect(revisions).toHaveLength(2);
    expect((revisions[0].snapshot as { summary: string }).summary).toBe(payload().summary);
    expect((revisions[1].snapshot as { summary: string }).summary).toBe('Clarified immutable submission');
    expect(await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).toMatchObject({ summary: 'Clarified immutable submission', status: 'PUBLISHED', visibility: 'PRIVATE' });
    session.actor = author;
    expect((await archiveShowcaseAction(id)).success).toBe(false);
    session.actor = admin;
    expect((await archiveShowcaseAction(id)).success).toBe(true);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).status).toBe('ARCHIVED');
  });
  it('requires an admin reopen before the author can edit a rejected first submission', async () => {
    const id = await draft();
    await submitDraft(id);
    const pending = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: pending.reviewVersion, action: 'REJECT', reason: 'Outside scope.' })).success).toBe(true);
    session.actor = author;
    expect((await saveDraft(id, payload())).success).toBe(false);
    expect((await reopenShowcaseAction(id)).success).toBe(false);
    session.actor = admin;
    expect((await reopenShowcaseAction(id)).success).toBe(true);
    session.actor = author;
    expect((await saveDraft(id, { ...payload(), summary: 'Reopened submission' })).success).toBe(true);
  });
  it('saves sections, snapshots them on submit and publishes the exact snapshot', async () => {
    const id = await draft();
    expect((await submitDraft(id)).success).toBe(true);
    expect((await saveDraft(id, { ...payload(), title: 'Unauthorized change while pending' })).success).toBe(false);
    expect((await publish(id)).success).toBe(true);
    const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, revisions: true, contributors: true } });
    expect(item.status).toBe('PUBLISHED');
    expect(item.content).toBe(payload().content);
    expect(item.links).toHaveLength(1);
    expect(item.contributors[0].userId).toBe(author.id);
    expect((item.revisions[0].snapshot as any).contributors[0].displayName).toBe(author.fullName);
    expect(item.authorDraft).toBeNull();
  });
  it('preserves sidebar links and uploaded PDFs through editing, review and publication', async () => {
    session.actor = author;
    const resources = [
      { kind: 'LINK' as const, label: 'Dataset thực nghiệm', url: 'https://example.com/dataset.zip', linkType: 'OTHER' as const },
      { kind: 'DOCUMENT' as const, label: 'Mô hình đã huấn luyện', url: '/uploads/resources/model.onnx', fileName: 'Mô hình đã huấn luyện', fileSize: 200, mimeType: 'application/octet-stream' },
      { kind: 'DOCUMENT' as const, label: 'Báo cáo toàn văn', url: '/uploads/documents/report.pdf', fileName: 'Báo cáo toàn văn', fileSize: 100, mimeType: 'application/pdf' },
    ];
    // Real uploads register ownership before their URLs can be used in a draft.
    await prisma.asset.createMany({ data: resources.filter(resource => resource.kind === 'DOCUMENT').map(resource => ({ url: resource.url, provider: 'local', ownerId: author.id, private: true })) });
    const saved = await saveDraft(null, { ...payload(), resources });
    if (!saved.success) throw Error(saved.error);
    const id = saved.data.id; items.push(id);
    let item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, attachments: true } });
    expect(item.links.map(link => link.url)).toEqual(expect.arrayContaining([resources[0].url, 'https://github.com/lab/robot']));
    expect(item.attachments.map(file => file.fileName)).toEqual(expect.arrayContaining(['Báo cáo toàn văn', 'Mô hình đã huấn luyện']));
    expect((await submitDraft(id)).success).toBe(true);
    expect((await publish(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, attachments: true } });
    expect(item.links.find(link => link.url === resources[0].url)?.label).toBe('Dataset thực nghiệm');
    expect(item.attachments.map(file => file.fileUrl)).toEqual(expect.arrayContaining([resources[1].url, resources[2].url]));
    session.actor = author;
    expect((await saveDraft(id, { ...payload(), resources: [] })).success).toBe(true);
    expect((await submitDraft(id)).success).toBe(true);
    expect((await publish(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, attachments: true } });
    expect(item.links.map(link => link.url)).toEqual(['https://github.com/lab/robot']);
    expect(item.attachments).toHaveLength(0);
  });
  it('keeps live content unchanged throughout an update, revision request and resubmission', async () => {
    const id = await draft(); await submitDraft(id); await publish(id);
    session.actor = author;
    expect((await saveDraft(id, { ...payload(), title: 'Bản cập nhật riêng' })).success).toBe(true);
    let item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(item.title).toBe(payload().title); expect(item.status).toBe('PUBLISHED'); expect(item.reviewStatus).toBe('DRAFT');
    expect((await submitDraft(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } }); session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'REQUEST_REVISION', reason: 'Bổ sung video demo.' })).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(item.status).toBe('PUBLISHED'); expect(item.title).toBe(payload().title); expect(item.reviewStatus).toBe('REVISION_REQUESTED');
    session.actor = author;
    expect((await saveDraft(id, { ...payload(), title: 'Bản cập nhật hoàn chỉnh' })).success).toBe(true);
    expect((await submitDraft(id)).success).toBe(true);
    expect((await publish(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(item.title).toBe('Bản cập nhật hoàn chỉnh'); expect(item.reviewStatus).toBeNull();
  });
  it('requires abstract and category, but allows project submission without detailed sections', async () => {
    session.actor = author;
    const saved = await saveDraft(null, { title: 'Only title' });
    if (!saved.success) throw Error(saved.error); items.push(saved.data.id);
    expect((await submitDraft(saved.data.id)).success).toBe(false);
    expect((await saveDraft(saved.data.id, { ...payload(), content: '', resources: [] })).success).toBe(true);
    expect((await submitDraft(saved.data.id)).success).toBe(true);
  });
  it('denies non-admin decisions and stale approval after the author withdraws', async () => {
    const id = await draft(); await submitDraft(id);
    const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'PUBLISH' })).success).toBe(false);
    expect((await withdrawSubmissionAction(id, item.reviewVersion)).success).toBe(true);
    session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'PUBLISH' })).success).toBe(false);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).status).toBe('DRAFT');
  });
  it('requires a rejection reason and preserves an already published article on update rejection', async () => {
    const id = await draft(); await submitDraft(id); await publish(id);
    session.actor = author; await saveDraft(id, { ...payload(), title: 'Rejected update' }); await submitDraft(id);
    const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } }); session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'REJECT' })).success).toBe(false);
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'REJECT', reason: 'Không phù hợp.' })).success).toBe(true);
    const after = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(after.status).toBe('PUBLISHED'); expect(after.title).toBe(item.title); expect(after.reviewStatus).toBe('REJECTED');
  });
  it('rejects another author editing a draft and rejects malformed media URLs', async () => {
    const id = await draft(); session.actor = admin;
    expect((await saveDraft(id, payload())).success).toBe(false);
    session.actor = author;
    expect((await saveDraft(id, { ...payload(), content: 'nexus-sections:v1\n{}' })).success).toBe(false);
  });
  it('allows only one decision for a submitted version', async () => {
    const id = await draft(); await submitDraft(id);
    const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } }); session.actor = admin;
    const input = { itemId: id, reviewVersion: item.reviewVersion, action: 'PUBLISH' as const };
    const results = await Promise.all([decideSubmissionAction(input), decideSubmissionAction(input)]);
    expect(results.filter(r => r.success)).toHaveLength(1);
  });

  it('rolls back live content and relations when the decision audit cannot commit', async () => {
    const id = await draft(); await submitDraft(id); await publish(id);
    const before = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, contributors: true } });
    session.actor = author;
    await saveDraft(id, { ...payload(), title: 'Must roll back', resources: [{ kind: 'LINK', label: 'New', url: 'https://example.com/new', linkType: 'OTHER' }] });
    await submitDraft(id);
    const [row] = await prisma.$queryRaw<Array<{ schema: string }>>`SELECT current_schema() AS schema`;
    if (!/^nexus_test_[a-f0-9]{32}$/.test(row.schema)) throw Error('Unexpected fixture schema');
    const schema = `"${row.schema}"`;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION ${schema}.reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test audit failure'; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER reject_test_audit BEFORE INSERT ON ${schema}.audit_events FOR EACH ROW WHEN (NEW.action = 'PUBLISH') EXECUTE FUNCTION ${schema}.reject_test_audit()`);
      expect(await publish(id)).toMatchObject({ success: false, code: 'INTERNAL' });
      const after = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, contributors: true } });
      expect(after.title).toBe(before.title);
      expect(after.links).toEqual(before.links);
      expect(after.contributors).toEqual(before.contributors);
      expect(after.reviewStatus).toBe('PENDING_REVIEW');
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS reject_test_audit ON ${schema}.audit_events`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${schema}.reject_test_audit()`);
      log.mockRestore();
    }
  });

  it('returns committed success even when cache invalidation fails', async () => {
    const id = await draft(); await submitDraft(id);
    const cache = await import('next/cache');
    vi.mocked(cache.revalidatePath).mockImplementationOnce(() => { throw Error('test cache failure'); });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await publish(id)).toMatchObject({ success: true });
      expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).status).toBe('PUBLISHED');
      expect(log).toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });
});
