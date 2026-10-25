import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import MemberProfilePage from '@/app/(shell)/(site)/members/[id]/page';

const mocks = vi.hoisted(() => ({ session: vi.fn(), user: vi.fn(), publications: vi.fn() }));
vi.mock('next/navigation', async original => ({ ...await original<typeof import('next/navigation')>(), useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }), usePathname: () => '/members/member' }));
vi.mock('@/features/identity/server/session', () => ({ getSession: mocks.session }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { findUnique: mocks.user } } }));
vi.mock('@/features/publications/server/queries', () => ({ listMemberPublications: mocks.publications }));
vi.mock('@/features/assets/server/avatar-actions', () => ({ uploadAvatarAction: vi.fn(), removeAvatarAction: vi.fn() }));
vi.mock('@/features/identity/server/profile-actions', () => ({ updateProfileAction: vi.fn() }));
vi.mock('@/features/identity/server/account-actions', () => ({ changePasswordAction: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(null);
  mocks.user.mockResolvedValue({ id: 'member', fullName: 'Nguyễn An', role: 'MEMBER', bio: 'Nghiên cứu robot', githubUrl: 'https://github.com/member' });
  mocks.publications.mockResolvedValue({ items: [{ id: 'paper', title: 'Bài nghiên cứu mẫu', type: 'RESEARCH_PAPER' }, { id: 'robot', title: 'Robot mẫu', type: 'PROJECT' }], total: 30, page: 1, totalPages: 5 });
});

it('combines publication types with labels and a total for visitors', async () => {
  const html = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: 'member' }), searchParams: Promise.resolve({}) }));
  expect(html).toContain('<h1');
  expect(html).toContain('Nguyễn An');
  expect(html).toContain('Bài nghiên cứu mẫu');
  expect(html).toContain('Robot mẫu');
  expect(html).toContain('Nghiên cứu khoa học');
  expect(html).toContain('Robotics &amp; IoT');
  expect(html).toContain('/ 30');
  expect(html).not.toContain('Loại công trình');
  expect(html).not.toContain('Tùy chọn ảnh đại diện');
  expect(html).toContain('Xem ảnh đại diện của Nguyễn An');
  expect(html).not.toContain('Chỉnh sửa thông tin cá nhân');
  expect(html).not.toContain('Quản lý tài khoản');
  expect(mocks.publications).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 6 }));
});

it('uses a single page parameter for the combined publication list', async () => {
  const html = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: 'member' }), searchParams: Promise.resolve({ page: '2' }) }));
  expect(html).toContain('Robot mẫu');
  expect(html).toContain('Bài nghiên cứu mẫu');
  expect(html).toContain('/members/member?page=2');
  expect(mocks.publications).toHaveBeenCalledWith({ memberId: 'member', authenticated: false, page: '2', pageSize: 6 });
});

it('offers editing and password actions only on the owner profile without an inline form', async () => {
  mocks.session.mockResolvedValue({ user: { id: 'member', role: 'MEMBER' } });
  const html = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: 'member' }) }));
  expect(html).toContain('Chỉnh sửa hồ sơ');
  expect(html).toContain('Đổi mật khẩu');
  expect(html).toContain('Tùy chọn ảnh đại diện');
  expect(html).not.toContain('href="/account/change-password"');
  expect(html).not.toContain('<form');
  expect(html).not.toContain('Điều hướng quản lý');
});

it('accepts older project pagination links on the combined list', async () => {
  const html = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: 'member' }), searchParams: Promise.resolve({ projectPage: '2' }) }));
  expect(html).toContain('Robot mẫu');
  expect(html).toContain('Bài nghiên cứu mẫu');
  expect(mocks.publications).toHaveBeenCalledWith(expect.objectContaining({ page: '2' }));
});

it('renders a single compact empty state', async () => {
  mocks.publications.mockResolvedValue({ items: [], total: 0, page: 1, totalPages: 1 });
  const html = renderToStaticMarkup(await MemberProfilePage({ params: Promise.resolve({ id: 'member' }), searchParams: Promise.resolve({}) }));
  expect(html).toContain('Chưa có công trình nào.');
  expect(html).not.toContain('Chưa có dự án nào.');
  expect(html).not.toContain('Phân trang công trình');
});
