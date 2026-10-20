import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DialogProvider } from '@/components/dialog-provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ManagementNav } from '@/components/management-layout';
import { MyPosts, type MyPost } from '@/components/my-posts';
import { matchesPostFilter } from '@/lib/dashboard-items';
import { adminMemberClientSelect } from '@/lib/public-user';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), userFind: vi.fn(), members: vi.fn(), items: vi.fn(), itemCount: vi.fn(), memberCount: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.userFind, findMany: mocks.members, count: mocks.memberCount }, showcaseItem: { findMany: mocks.items, count: mocks.itemCount } } }));
vi.mock('@/components/navbar', () => ({ Navbar: () => <header>CLB Robotics &amp; IoT</header> }));
vi.mock('@/components/academic-footer', () => ({ AcademicFooter: () => <footer>CLB Robotics &amp; IoT</footer> }));
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard', useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), redirect: (url: string) => { throw new Error(`redirect:${url}`); }, notFound: () => { throw new Error('notFound'); } }));
vi.mock('@/actions/admin-actions', () => ({ createMemberAction: vi.fn(), updateUserRoleAction: vi.fn(), deleteMemberAction: vi.fn() }));
vi.mock('@/actions/showcase-actions', () => ({ replacePinnedShowcaseItemAction: vi.fn(), togglePinShowcaseItemAction: vi.fn() }));
vi.mock('@/actions/approval-actions', () => ({ withdrawSubmissionAction: vi.fn() }));
vi.stubGlobal('React', React);

import AdminDashboardPage from '@/app/admin/page';
import AdminMembersPage from '@/app/admin/members/page';
import DashboardPage from '@/app/dashboard/page';
import MemberProfilePage from '@/app/members/[id]/page';

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
    expect(html).toContain('Tổng quan quản trị');
    expect(html).toContain('>12</span>');
    expect(mocks.items).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    mocks.auth.mockResolvedValue({ user: { id: member.id, role: 'MEMBER' } });
    await expect(AdminDashboardPage()).rejects.toThrow('redirect:/');
  });

  it('keeps private member fields out of client row queries', async () => {
    const html = renderToStaticMarkup(await AdminMembersPage());
    expect(mocks.members).toHaveBeenCalledWith(expect.objectContaining({ select: adminMemberClientSelect }));
    expect(html).toContain('Nguyễn An');
    expect(html).toContain('Thu quyền đăng bài');
    expect(html).toContain('Tìm thành viên theo họ tên');
  });

  it('loads only the fields required for the author list and shows the create action', async () => {
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toContain('Bài đăng của tôi');
    expect(html).toContain('Đăng bài mới');
    const query = mocks.userFind.mock.calls[0][0];
    expect(query.include.createdItems.select).not.toHaveProperty('authorDraft');
    expect(query.include.createdItems.select).not.toHaveProperty('content');
  });

  it('offers draft editing and locks pending submissions until they are withdrawn', () => {
    const draft = renderToStaticMarkup(<MyPosts items={[post]} isUploader />);
    expect(draft).toContain(`/dashboard/items/${post.id}/edit`);
    const pending = renderToStaticMarkup(<DialogProvider><MyPosts items={[{ ...post, status: 'PENDING_REVIEW' }]} isUploader /></DialogProvider>);
    expect(pending).toContain('Rút bài để sửa');
    expect(pending).not.toContain(`/dashboard/items/${post.id}/edit`);
    const readOnly = renderToStaticMarkup(<MyPosts items={[post]} isUploader={false} />);
    expect(readOnly).toContain('Chỉ đọc');
    expect(readOnly).not.toContain(`/dashboard/items/${post.id}/edit`);
  });

  it('shows account actions only on the signed-in user profile', async () => {
    const own = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: member.id }) }));
    expect(own).toContain('Đổi mật khẩu');
    expect(own).toContain('Điều hướng quản lý');
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
