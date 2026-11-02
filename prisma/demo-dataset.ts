import { Prisma, type PrismaClient, type Role, type ItemStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { DemoAssets } from './demo-assets';
import { serializeArticle } from '../src/features/submissions/model/article';

const PASSWORD = 'NexusDemo2026!Start';
const states: ItemStatus[] = ['DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'READY_FOR_APPROVAL', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
const names = ['Nguyễn Minh An', 'Trần Hoàng Bình', 'Lê Ngọc Chi', 'Phạm Đức Dũng', 'Hoàng Thu Hà', 'Vũ Quang Huy', 'Đặng Bảo Khang', 'Bùi Thanh Linh', 'Đỗ Hải Nam', 'Hồ Phương Thảo'];
const topics = ['Robot tự hành trong thư viện', 'Nhận diện vật thể trên thiết bị biên', 'Giám sát chất lượng không khí', 'Cánh tay robot hỗ trợ học tập', 'Bản đồ số cho khuôn viên xanh', 'Mạng cảm biến tiết kiệm năng lượng', 'Điều khiển drone trong nhà', 'Dữ liệu mở cho giao thông thông minh', 'Thị giác máy tính trong nông nghiệp', 'Học tăng cường cho điều hướng'];

/** Create-only demo data. CLI callers must apply assertDemoSeedAllowed first.
 * Direct calls exist for isolated integration fixtures. No provider or file writes.
 */
export async function seedFullDemo(db: PrismaClient, assets: DemoAssets) {
  if (assets.thumbnails.length < 12 || !assets.avatars.length) throw new Error('Demo dataset needs twelve thumbnails and one avatar.');
  for (const asset of [...assets.thumbnails, ...assets.avatars, assets.document, assets.resource]) {
    if (!/^\/uploads\/(?:thumbnails\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)|documents\/[a-zA-Z0-9_-]+\.pdf|resources\/[a-zA-Z0-9_-]+\.[a-z0-9]{1,16})$/.test(asset.url) || !Number.isSafeInteger(asset.byteSize) || asset.byteSize < 1) throw new Error('Invalid demo asset manifest.');
  }
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(192837466)::text`;
    const specs: Array<{ email: string; role: Role; number: number }> = [
      ...Array.from({ length: 2 }, (_, i) => ({ email: i ? 'admin2@gmail.com' : 'admin@gmail.com', role: 'ADMIN' as const, number: i })),
      ...Array.from({ length: 10 }, (_, i) => ({ email: i ? `core${i + 1}@gmail.com` : 'core@gmail.com', role: 'CORE_MEMBER' as const, number: i })),
      ...Array.from({ length: 40 }, (_, i) => ({ email: `member${i + 1}@gmail.com`, role: 'MEMBER' as const, number: i })),
      ...Array.from({ length: 4 }, (_, i) => ({ email: `editor${i + 1}@gmail.com`, role: 'EDITOR' as const, number: i })),
      ...Array.from({ length: 4 }, (_, i) => ({ email: `guest${i + 1}@gmail.com`, role: 'GUEST' as const, number: i })),
    ];
    const users: Array<{ id: string; email: string; fullName: string; publicSlug: string }> = [];
    // Create the main author first so the registry can attribute every reusable asset.
    const leaderSpecs = [specs[0], specs[2]];
    for (const spec of leaderSpecs) {
      const user = await tx.user.upsert({ where: { email: spec.email }, update: {}, create: { email: spec.email, fullName: spec.role === 'ADMIN' ? 'Nguyễn Minh An' : 'Trần Hoàng Bình', passwordHash, role: spec.role, status: 'ACTIVE', bio: 'Cùng xây dựng cộng đồng Robotics & IoT: học hỏi, thử nghiệm và chia sẻ kiến thức.' } });
      users.push(user);
    }
    const admin = users[0], core = users[1];
    for (const asset of [...assets.thumbnails, ...assets.avatars, assets.document, assets.resource]) {
      await tx.asset.upsert({ where: { url: asset.url }, update: {}, create: { url: asset.url, provider: 'local', ownerId: core.id, byteSize: BigInt(asset.byteSize), private: true } });
    }
    for (const [index, spec] of specs.entries()) {
      if (leaderSpecs.includes(spec)) continue;
      const fullName = `${names[index % names.length]} ${['Khóa 2022', 'Khóa 2023', 'Khóa 2024', 'Khóa 2025', 'Khóa 2026', 'Cộng tác viên'][Math.floor(index / 10)]}`;
      const inactive = spec.number >= 35 || spec.role === 'GUEST';
      const status = spec.email === 'guest1@gmail.com' ? 'ACTIVE' as const : inactive ? spec.number % 2 ? 'PENDING' as const : 'SUSPENDED' as const : 'ACTIVE' as const;
      const bio = index % 7 === 0 ? null : index % 9 === 0 ? 'Yêu robot.' : `Tôi là ${fullName}, quan tâm đến robot tự hành, hệ thống nhúng và học máy. ` + (index % 8 === 0 ? 'Mỗi dự án là dịp kết nối nghiên cứu với nhu cầu thực tế. Tôi muốn chia sẻ cả kết quả, những lần thử nghiệm chưa thành công và bài học của nhóm. '.repeat(8) : 'Mong được cùng các bạn tạo nên những sản phẩm có ích cho cộng đồng.');
      users.push(await tx.user.upsert({ where: { email: spec.email }, update: {}, create: {
        email: spec.email, fullName, passwordHash, role: spec.role, status, bio,
        deletedAt: spec.role === 'MEMBER' && spec.number === 39 ? new Date('2026-01-01') : null,
        mustChangePassword: spec.email === 'member3@gmail.com',
        avatarUrl: index % 4 === 0 ? null : assets.avatars[index % assets.avatars.length].url,
        profileLinks: index % 3 === 0 ? [] : [{ title: 'GitHub', url: `https://github.com/demo-full-${index}` }, { title: 'Trang cá nhân', url: `https://example.com/demo-full-${index}` }],
        createdAt: new Date(Date.UTC(2024 + index % 3, index % 12, 1)),
      } }));
    }
    const editor = users.find(user => user.email === 'editor1@gmail.com')!;
    const members = users.filter(user => user.email.startsWith('member')).slice(0, 30);
    const categories = {
      PROJECT: await tx.category.upsert({ where: { slug: 'robotics-iot' }, update: {}, create: { slug: 'robotics-iot', name: 'Robotics & IoT', layoutType: 'SHOWCASE_GRID', isNavFeatured: true, displayOrder: 0 } }),
      RESEARCH_PAPER: await tx.category.upsert({ where: { slug: 'bai-bao-khoa-hoc' }, update: {}, create: { slug: 'bai-bao-khoa-hoc', name: 'Nghiên cứu khoa học', layoutType: 'BIBLIOGRAPHY', isNavFeatured: true, displayOrder: 1 } }),
    };
    const scenarios: Array<{ type: 'PROJECT' | 'RESEARCH_PAPER'; status: ItemStatus; reviewStatus?: ItemStatus; variant: number; slug: string }> = [];
    for (const type of ['PROJECT', 'RESEARCH_PAPER'] as const) {
      for (const status of states) for (let variant = 0; variant < 2; variant++) scenarios.push({ type, status, variant, slug: `demo-full-${type.toLowerCase()}-${status.toLowerCase()}-${variant + 1}` });
      for (let variant = 0; variant < 10; variant++) scenarios.push({ type, status: 'PUBLISHED', variant, slug: `demo-full-${type.toLowerCase()}-portfolio-${variant + 1}` });
      for (const reviewStatus of ['DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'REJECTED'] as const) scenarios.push({ type, status: 'PUBLISHED', reviewStatus, variant: 0, slug: `demo-full-${type.toLowerCase()}-live-review-${reviewStatus.toLowerCase()}` });
    }
    let createdPosts = 0, pinned = await tx.showcaseItem.count({ where: { isPinned: true } });
    for (const [index, scenario] of scenarios.entries()) {
      if (await tx.showcaseItem.findUnique({ where: { slug: scenario.slug }, select: { id: true } })) continue;
      const creator = scenario.variant === 0 || scenario.reviewStatus ? core : admin;
      const title = `${topics[index % topics.length]}${index % 11 === 0 ? ': nghiên cứu thiết kế, triển khai và đánh giá trong môi trường thực tế của sinh viên' : ''} · ${index + 1}`;
      const summary = `DỮ LIỆU DEMO — ${scenario.type === 'PROJECT' ? 'Dự án' : 'Nghiên cứu'} minh họa quy trình từ ý tưởng đến kết quả. Nhóm đánh giá tính khả thi, độ chính xác và giới hạn của giải pháp.`;
      const thumbnailUrl = index % 9 === 0 ? null : assets.thumbnails[index % assets.thumbnails.length].url;
      const content = serializeArticle({ version: 1, sections: [
        { id: 'context', title: 'Bối cảnh và mục tiêu', blocks: [{ id: 'context-text', kind: 'TEXT', text: `${summary}\n\nMục tiêu là xây dựng một nguyên mẫu dễ tái lập, phù hợp với điều kiện phòng thí nghiệm và có thể tiếp tục mở rộng.` }] },
        { id: 'method', title: 'Phương pháp và thiết kế', blocks: [{ id: 'method-text', kind: 'TEXT', text: 'Nhóm thu thập dữ liệu, xây dựng đường cơ sở và so sánh nhiều phương án. Kết quả được đo qua các lần thử độc lập để nhận biết sai số và tình huống khó.' }, { id: 'method-image', kind: 'IMAGE', url: assets.thumbnails[index % assets.thumbnails.length].url, caption: 'Không gian làm việc và nguyên mẫu minh họa', alt: 'Hình minh họa cho quá trình thử nghiệm Robotics & IoT' }] },
        { id: 'results', title: 'Kết quả và hướng phát triển', blocks: [{ id: 'results-text', kind: 'TEXT', text: 'Nguyên mẫu hoàn thành các kịch bản cơ bản. Các số liệu trong bộ dữ liệu demo chỉ có mục đích trình bày; bước tiếp theo là thử nghiệm rộng hơn và công bố dữ liệu có kiểm chứng.' }] },
      ] });
      const contributors = [{ userId: creator.id, role: scenario.type === 'PROJECT' ? 'PROJECT_LEAD' as const : 'FIRST_AUTHOR' as const, displayOrder: 0 }, { userId: members[index % members.length].id, role: 'CO_AUTHOR' as const, displayOrder: 1 }, { externalName: 'TS. Phan Minh Tâm', externalAffiliation: 'Đại học Khoa học Tự nhiên', externalLink: 'https://example.com/demo-full-advisor', role: 'ADVISOR' as const, displayOrder: 2 }];
      const resources = [{ kind: 'DOCUMENT', label: 'Báo cáo toàn văn', url: assets.document.url, fileName: 'demo-full-report.pdf', fileSize: assets.document.byteSize, mimeType: 'application/pdf' }, { kind: 'LINK', label: 'Mã nguồn và dữ liệu', url: assets.resource.url, linkType: 'OTHER' }];
      const liveSnapshot = { type: scenario.type, categoryId: categories[scenario.type].id, title, summary, content, thumbnailUrl, publishedYear: 2026, suggestedField: 'Robotics & IoT', customProjectType: '', contributors, resources };
      const snapshot = scenario.reviewStatus ? { ...liveSnapshot, title: `${title} — cập nhật`, summary: `${summary} Bản cập nhật bổ sung đánh giá mới, đang chờ hoàn tất quy trình duyệt.`, content: content.replace('Nguyên mẫu hoàn thành', 'Bản cập nhật bổ sung đánh giá hiệu năng; nguyên mẫu hoàn thành') } : liveSnapshot;
      const isPublished = scenario.status === 'PUBLISHED';
      const isPinned = isPublished && scenario.variant % 5 !== 1 && !scenario.reviewStatus && pinned < 3;
      if (isPinned) pinned++;
      const reviewVersion = scenario.status === 'READY_FOR_APPROVAL' ? 0 : scenario.status === 'DRAFT' ? 0 : 1;
      const item = await tx.showcaseItem.create({ data: {
        slug: scenario.slug, title, summary, content, type: scenario.type, categoryId: categories[scenario.type].id, creatorId: creator.id, thumbnailUrl,
        status: scenario.status, reviewStatus: scenario.reviewStatus, reviewVersion,
        authorDraft: (scenario.reviewStatus || ['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(scenario.status)) ? snapshot as Prisma.InputJsonValue : undefined,
        visibility: scenario.variant % 5 === 1 ? 'PRIVATE' : 'PUBLIC', scope: index % 3 === 0 ? 'OPEN_SOURCE' : 'CLUB_CONTRIBUTION',
        publishedYear: 2026 - index % 4, publishedAt: isPublished ? new Date(Date.UTC(2026, 9, 26 - index % 25)) : null,
        isPinned, pinnedAt: isPinned ? new Date('2026-10-26') : null,
        rejectionReason: scenario.status === 'REJECTED' || scenario.reviewStatus === 'REJECTED' ? 'Cần làm rõ phương pháp đánh giá và nguồn dữ liệu trước khi gửi lại.' : null,
        contributors: { create: contributors },
        links: { create: [{ label: 'Kho mã nguồn', url: `https://github.com/example/demo-full-${index}`, type: 'GITHUB' }, { label: 'Tải mã nguồn minh họa', url: assets.resource.url, type: 'OTHER' }] },
        attachments: { create: { fileName: 'demo-full-report.pdf', fileUrl: assets.document.url, fileSize: assets.document.byteSize, mimeType: 'application/pdf' } },
      } });
      if (scenario.status !== 'DRAFT') {
        const revision = await tx.submissionRevision.create({ data: { itemId: item.id, revisionNumber: 1, submittedById: creator.id, snapshot: (scenario.reviewStatus === 'DRAFT' ? liveSnapshot : snapshot) as Prisma.InputJsonValue } });
        if (scenario.status === 'READY_FOR_APPROVAL') await tx.editorialDraft.create({ data: { itemId: item.id, assignedEditorId: editor.id, overrides: { title: `${title} — bản biên tập`, summary }, checklist: { metadata: true, sources: true }, completedAt: new Date('2026-10-25') } });
        if (['PENDING_REVIEW', 'REVISION_REQUESTED', 'REJECTED', 'READY_FOR_APPROVAL'].includes(scenario.reviewStatus ?? scenario.status)) {
          await tx.reviewComment.createMany({ data: [{ itemId: item.id, revisionId: revision.id, fieldKey: 'content', body: 'Vui lòng bổ sung điều kiện thử nghiệm và nêu rõ giới hạn của phương pháp.', audience: 'AUTHOR', severity: 'REQUIRED', status: scenario.status === 'READY_FOR_APPROVAL' ? 'RESOLVED' : 'OPEN', authorId: editor.id, resolvedById: scenario.status === 'READY_FOR_APPROVAL' ? creator.id : null, resolvedAt: scenario.status === 'READY_FOR_APPROVAL' ? new Date('2026-10-25') : null }, { itemId: item.id, revisionId: revision.id, fieldKey: 'summary', body: 'Đã làm rõ mục tiêu và kết quả chính trong phần tóm tắt.', audience: 'EDITORIAL', severity: 'SUGGESTION', status: 'RESOLVED', authorId: admin.id, resolvedById: editor.id, resolvedAt: new Date('2026-10-25') }] });
        }
      }
      await tx.auditEvent.create({ data: { itemId: item.id, actorId: creator.id, action: 'DEMO_CREATED', metadata: { source: 'demo-full', status: scenario.status, reviewStatus: scenario.reviewStatus ?? null } } });
      createdPosts++;
    }
    const photo = (slot: number) => ({ id: `demo-full-moment-${slot + 1}`, src: assets.thumbnails[slot % assets.thumbnails.length].url, title: ['Cùng nhau tìm lời giải', 'Từ ý tưởng đến nguyên mẫu', 'Chia sẻ và kết nối'][slot % 3] + ` · ${slot + 1}`, alt: 'Sinh hoạt nghiên cứu Robotics & IoT', shape: (['wide', 'portrait', 'square'] as const)[slot % 3], tilt: (['-3deg', '3deg', '-2deg', '4deg', '2deg'] as const)[slot % 5], visible: true, slot });
    for (const [id, count] of [['home', 12], ['research', 3]] as const) await tx.homeMomentsGallery.upsert({ where: { id }, update: {}, create: { id, photos: Array.from({ length: count }, (_, slot) => photo(slot)) } });
    const legacy = await tx.showcaseItem.findUniqueOrThrow({ where: { slug: 'demo-full-project-ready_for_approval-1' }, select: { id: true } });
    return { users: users.length, posts: scenarios.length, createdPosts, password: PASSWORD, admin: admin.email, core: core.email, urls: { home: '/', directory: '/members', coreProfile: `/members/${core.id}`, dashboard: '/dashboard', review: '/admin/reviews', published: '/showcase/demo-full-project-published-1', legacyEditorial: `/admin/reviews/${legacy.id}` } };
  }, { timeout: 120_000, maxWait: 30_000 });
}
