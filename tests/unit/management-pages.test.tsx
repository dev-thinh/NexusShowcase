import { ManagementNav } from '@/app/(shell)/_components/management-layout';
import { adminMemberClientSelect } from '@/features/identity/model/public-user';
import { MyPosts, type MyPost } from '@/features/submissions/components/my-posts';
import { matchesPostFilter } from '@/features/submissions/model/dashboard-items';
import { DialogProvider } from '@/shared/dialogs/dialog-provider';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), userFind: vi.fn(), members: vi.fn(), items: vi.fn(), itemCount: vi.fn(), memberCount: vi.fn(), groups: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/identity/server/auth', () => ({ auth: mocks.auth }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { groupBy: mocks.groups, findUnique: mocks.userFind, findMany: mocks.members, count: mocks.memberCount }, showcaseItem: { groupBy: mocks.groups, findMany: mocks.items, count: mocks.itemCount } } }));
vi.mock('@/app/(shell)/_components/navbar', () => ({ Navbar: () => <header>CLB Robotics &amp; IoT</header> }));
vi.mock('@/shared/ui/academic-footer', () => ({ AcademicFooter: () => <footer>CLB Robotics &amp; IoT</footer> }));
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard', useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), redirect: (url: string) => { throw new Error(`redirect:${url}`); }, notFound: () => { throw new Error('notFound'); } }));
vi.mock('@/features/identity/server/member-actions', () => ({ createMemberAction: vi.fn(), updateUserRoleAction: vi.fn(), deleteMemberAction: vi.fn() }));
vi.mock('@/features/publications/server/actions', () => ({ setShowcasePinAction: vi.fn() }));
vi.mock('@/features/review/server/actions', () => ({ withdrawSubmissionAction: vi.fn() }));
vi.stubGlobal('React', React);

import AdminMembersPage from '@/app/(shell)/(account)/admin/members/page';
import AdminDashboardPage from '@/app/(shell)/(account)/admin/page';
import DashboardPage from '@/app/(shell)/(account)/dashboard/page';
import MemberProfilePage from '@/app/(shell)/(site)/members/[id]/page';

const post: MyPost = { id: 'post-1', slug: 'robot-tu-hanh', title: 'Robot tự hành', summary: 'Hệ thống điều hướng trong nhà', type: 'PROJECT', status: 'DRAFT', reviewStatus: null, reviewVersion: 0, rejectionReason: null, publishedYear: 2026, updatedAt: new Date('2026-10-17T00:00:00Z'), thumbnailUrl: null };
const member = { id: 'member-1', fullName: 'Nguyễn An', role: 'CORE_MEMBER', mustChangePassword: false, avatarUrl: null, bio: 'Nghiên cứu robot và hệ thống nhúng.', githubUrl: 'https://github.com/example', linkedinUrl: null, googleScholarUrl: null, portfolioUrl: null, createdAt: new Date('2026-01-01'), createdItems: [post], contributions: [] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: member.id, role: 'ADMIN' } });
  mocks.userFind.mockResolvedValue(member);
  mocks.members.mockResolvedValue([member]);
  mocks.memberCount.mockResolvedValue(3);
  mocks.itemCount.mockImplementation(({ where }) => Promise.resolve(where.isPinned ? 12 : 2));
  mocks.items.mockResolvedValue([]);
  mocks.groups.mockResolvedValue([{ status: 'DRAFT', reviewStatus: null, _count: { _all: 1 } }]);
});

describe('management pages', () => {
  it('limits management navigation to the current user permissions', () => {
    const html = renderToStaticMarkup(<ManagementNav active="posts" userId={member.id} />);
    expect(html).toContain(`/members/${member.id}`);
    expect(html).not.toContain('/admin');
    expect(html).toContain('aria-current="page"');
  });

  it('keeps admin access checks and counts all pins rather than only the preview list', async () => {
    const html = renderToStaticMarkup(<DialogProvider>{await AdminDashboardPage()}</DialogProvider>);
    expect(html).toContain('Tổng quan');
    expect(html).toContain('>12</span>');
    expect(mocks.items).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    mocks.auth.mockResolvedValue({ user: { id: member.id, role: 'MEMBER' } });
    await expect(AdminDashboardPage()).rejects.toThrow('redirect:/');
  });

  it('keeps private member fields out of client row queries', async () => {
    const html = renderToStaticMarkup(await AdminMembersPage({ searchParams: Promise.resolve({}) }));
    expect(mocks.members).toHaveBeenCalledWith(expect.objectContaining({ select: adminMemberClientSelect }));
    expect(html).toContain('Nguyễn An');
    expect(html).toContain('Thu quyền đăng bài');
    expect(html).toContain('Tìm thành viên theo họ tên');
  });

  it('loads only the fields required for the author list and shows the create action', async () => {
    const html = renderToStaticMarkup(await DashboardPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('Bài đăng của tôi');
    expect(html).toContain('Đăng bài mới');
    const query = mocks.items.mock.calls[0][0];
    expect(query.select).not.toHaveProperty('authorDraft');
    expect(query.select).not.toHaveProperty('content');
  });

  it('offers draft editing and locks pending submissions until they are withdrawn', () => {
    const draft = renderToStaticMarkup(<MyPosts query="" filter="ALL" counts={{ ALL: 1, DRAFT: 1, PENDING_REVIEW: 0, REVISION_REQUESTED: 0, PUBLISHED: 0, REJECTED: 0 }} total={1} items={[post]} isUploader />);
    expect(draft).toContain(`/dashboard/items/${post.id}/edit`);
    const pending = renderToStaticMarkup(<DialogProvider><MyPosts query="" filter="ALL" counts={{ ALL: 1, DRAFT: 1, PENDING_REVIEW: 0, REVISION_REQUESTED: 0, PUBLISHED: 0, REJECTED: 0 }} total={1} items={[{ ...post, status: 'PENDING_REVIEW' }]} isUploader /></DialogProvider>);
    expect(pending).toContain('Rút bài để sửa');
    expect(pending).not.toContain(`/dashboard/items/${post.id}/edit`);
    const readOnly = renderToStaticMarkup(<MyPosts query="" filter="ALL" counts={{ ALL: 1, DRAFT: 1, PENDING_REVIEW: 0, REVISION_REQUESTED: 0, PUBLISHED: 0, REJECTED: 0 }} total={1} items={[post]} isUploader={false} />);
    expect(readOnly).toContain('Chỉ đọc');
    expect(readOnly).not.toContain(`/dashboard/items/${post.id}/edit`);
  });

  it('shows account actions only on the signed-in user profile', async () => {
    const own = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: member.id }) }));
    expect(own).toContain('Đổi mật khẩu');
    expect(own).toContain('Tùy chọn ảnh đại diện');
    expect(own).toContain('Chỉnh sửa hồ sơ');
    mocks.auth.mockResolvedValue(null);
    const publicProfile = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: member.id }) }));
    expect(publicProfile).not.toContain('Đổi mật khẩu');
    expect(publicProfile).not.toContain('Điều hướng quản lý');
    expect(publicProfile).toContain('Nghiên cứu robot');
    expect(publicProfile).not.toContain('Google Scholar');
  });
});

describe('author list filters', () => {
  it('matches Vietnamese titles without accents', () => {
    expect(matchesPostFilter(post, 'ALL', 'tu hanh')).toBe(true);
    expect(matchesPostFilter(post, 'ALL', 'khong co')).toBe(false);
  });
  it('includes pending updates and legacy approvals in the pending filter', () => {
    expect(matchesPostFilter({ ...post, status: 'PUBLISHED', reviewStatus: 'PENDING_REVIEW' }, 'PENDING_REVIEW')).toBe(true);
    expect(matchesPostFilter({ ...post, status: 'READY_FOR_APPROVAL' }, 'PENDING_REVIEW')).toBe(true);
    expect(matchesPostFilter(post, 'PENDING_REVIEW')).toBe(false);
  });
  it('surfaces requested changes to already published posts', () => {
    expect(matchesPostFilter({ ...post, status: 'PUBLISHED', reviewStatus: 'REVISION_REQUESTED' }, 'REVISION_REQUESTED')).toBe(true);
    expect(matchesPostFilter({ ...post, status: 'REJECTED' }, 'REJECTED')).toBe(true);
  });
});
