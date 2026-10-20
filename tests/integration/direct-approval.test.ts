import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { saveShowcaseDraftAction, submitShowcaseForReviewAction } from '@/actions/showcase-actions';
import { decideSubmissionAction, withdrawSubmissionAction } from '@/actions/approval-actions';
import { serializeArticle, articleFromLegacy } from '@/lib/article-content';
import type { Role } from '@prisma/client';

const session = vi.hoisted(() => ({ actor: null as null | { id: string; fullName: string; role: Role; status: 'ACTIVE' } }));
vi.mock('@/lib/current-user', () => ({ getCurrentUser: async (roles?: Role[]) => session.actor && (!roles || roles.includes(session.actor.role)) ? session.actor : null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

let author: NonNullable<typeof session.actor>, admin: NonNullable<typeof session.actor>;
let categoryId: string;
const items: string[] = [];
const createdCategories: string[] = [];
const userIds: string[] = [];
const payload = () => ({ title: 'Robot thử nghiệm', summary: 'Abstract bắt buộc', categoryId, type: 'PROJECT' as const, contributors: [{ userId: author.id, role: 'CONTRIBUTOR' as const, displayOrder: 0 }], resources: [], content: serializeArticle(articleFromLegacy('Kết quả **thử nghiệm**', [{ kind: 'LINK', label: 'Mã nguồn', url: 'https://github.com/lab/robot', linkType: 'GITHUB' }])) });
async function draft() {
  session.actor = author;
  const saved = await saveShowcaseDraftAction(null, payload());
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
  it('saves sections, snapshots them on submit and publishes the exact snapshot', async () => {
    const id = await draft();
    expect((await submitShowcaseForReviewAction(id)).success).toBe(true);
    expect((await saveShowcaseDraftAction(id, { ...payload(), title: 'Unauthorized change while pending' })).success).toBe(false);
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
    const saved = await saveShowcaseDraftAction(null, { ...payload(), resources });
    if (!saved.success) throw Error(saved.error);
    const id = saved.data.id; items.push(id);
    let item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, attachments: true } });
    expect(item.links.map(link => link.url)).toEqual(expect.arrayContaining([resources[0].url, 'https://github.com/lab/robot']));
    expect(item.attachments.map(file => file.fileName)).toEqual(expect.arrayContaining(['Báo cáo toàn văn', 'Mô hình đã huấn luyện']));
    expect((await submitShowcaseForReviewAction(id)).success).toBe(true);
    expect((await publish(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, attachments: true } });
    expect(item.links.find(link => link.url === resources[0].url)?.label).toBe('Dataset thực nghiệm');
    expect(item.attachments.map(file => file.fileUrl)).toEqual(expect.arrayContaining([resources[1].url, resources[2].url]));
    session.actor = author;
    expect((await saveShowcaseDraftAction(id, { ...payload(), resources: [] })).success).toBe(true);
    expect((await submitShowcaseForReviewAction(id)).success).toBe(true);
    expect((await publish(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id }, include: { links: true, attachments: true } });
    expect(item.links.map(link => link.url)).toEqual(['https://github.com/lab/robot']);
    expect(item.attachments).toHaveLength(0);
  });
  it('keeps live content unchanged throughout an update, revision request and resubmission', async () => {
    const id = await draft(); await submitShowcaseForReviewAction(id); await publish(id);
    session.actor = author;
    expect((await saveShowcaseDraftAction(id, { ...payload(), title: 'Bản cập nhật riêng' })).success).toBe(true);
    let item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(item.title).toBe(payload().title); expect(item.status).toBe('PUBLISHED'); expect(item.reviewStatus).toBe('DRAFT');
    expect((await submitShowcaseForReviewAction(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } }); session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'REQUEST_REVISION', reason: 'Bổ sung video demo.' })).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(item.status).toBe('PUBLISHED'); expect(item.title).toBe(payload().title); expect(item.reviewStatus).toBe('REVISION_REQUESTED');
    session.actor = author;
    expect((await saveShowcaseDraftAction(id, { ...payload(), title: 'Bản cập nhật hoàn chỉnh' })).success).toBe(true);
    expect((await submitShowcaseForReviewAction(id)).success).toBe(true);
    expect((await publish(id)).success).toBe(true);
    item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(item.title).toBe('Bản cập nhật hoàn chỉnh'); expect(item.reviewStatus).toBeNull();
  });
  it('requires abstract and category, but allows project submission without detailed sections', async () => {
    session.actor = author;
    const saved = await saveShowcaseDraftAction(null, { title: 'Only title' });
    if (!saved.success) throw Error(saved.error); items.push(saved.data.id);
    expect((await submitShowcaseForReviewAction(saved.data.id)).success).toBe(false);
    expect((await saveShowcaseDraftAction(saved.data.id, { ...payload(), content: '', resources: [] })).success).toBe(true);
    expect((await submitShowcaseForReviewAction(saved.data.id)).success).toBe(true);
  });
  it('denies non-admin decisions and stale approval after the author withdraws', async () => {
    const id = await draft(); await submitShowcaseForReviewAction(id);
    const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'PUBLISH' })).success).toBe(false);
    expect((await withdrawSubmissionAction(id, item.reviewVersion)).success).toBe(true);
    session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'PUBLISH' })).success).toBe(false);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).status).toBe('DRAFT');
  });
  it('requires a rejection reason and preserves an already published article on update rejection', async () => {
    const id = await draft(); await submitShowcaseForReviewAction(id); await publish(id);
    session.actor = author; await saveShowcaseDraftAction(id, { ...payload(), title: 'Rejected update' }); await submitShowcaseForReviewAction(id);
    const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } }); session.actor = admin;
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'REJECT' })).success).toBe(false);
    expect((await decideSubmissionAction({ itemId: id, reviewVersion: item.reviewVersion, action: 'REJECT', reason: 'Không phù hợp.' })).success).toBe(true);
    const after = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
    expect(after.status).toBe('PUBLISHED'); expect(after.title).toBe(item.title); expect(after.reviewStatus).toBe('REJECTED');
  });
  it('rejects another author editing a draft and rejects malformed media URLs', async () => {
    const id = await draft(); session.actor = admin;
    expect((await saveShowcaseDraftAction(id, payload())).success).toBe(false);
    session.actor = author;
    expect((await saveShowcaseDraftAction(id, { ...payload(), content: 'nexus-sections:v1\n{}' })).success).toBe(false);
  });
  it('allows only one decision for a submitted version', async () => {
    const id = await draft(); await submitShowcaseForReviewAction(id);
    const item = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } }); session.actor = admin;
    const input = { itemId: id, reviewVersion: item.reviewVersion, action: 'PUBLISH' as const };
    const results = await Promise.all([decideSubmissionAction(input), decideSubmissionAction(input)]);
    expect(results.filter(r => r.success)).toHaveLength(1);
  });
});
