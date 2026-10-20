import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AcademicFooter } from '@/components/academic-footer';
import { ShowcaseCard } from '@/components/showcase-card';
import { EmptyState } from '@/components/ui/empty-state';
import { publicUserSelect } from '@/lib/public-user';
import { getSession as auth } from '@/lib/session';
import Link from 'next/link';
import { ManagementHeader, ManagementNav } from '@/components/management-layout';
import { FileText, Code2, Github, Linkedin, GraduationCap, Globe, ShieldCheck, UserCheck, KeyRound, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isOwnProfile = session?.user?.id === id;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...publicUserSelect,
      contributions: {
        where: {
          item: { status: 'PUBLISHED' },
        },
        include: {
          item: {
              omit: { authorDraft: true },
            include: {
              contributors: {
                include: { user: { select: publicUserSelect } },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { item: { publishedYear: 'desc' } },
      },
    },
  });

  if (!user) notFound();

  const publishedItems = user.contributions.map((c) => c.item);
  const papers = publishedItems.filter((i) => i.type === 'RESEARCH_PAPER');
  const projects = publishedItems.filter((i) => i.type === 'PROJECT');

  const roleBadgeConfig = {
    ADMIN: { label: 'Quản trị viên', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: ShieldCheck },
    CORE_MEMBER: { label: 'Thành viên nòng cốt', color: 'bg-blue-50 text-blue-800 border-blue-200/80', icon: UserCheck },
    EDITOR: { label: 'Thành viên', color: 'bg-indigo-50 text-indigo-800 border-indigo-200/80', icon: UserCheck },
    MEMBER: { label: 'Thành viên', color: 'bg-slate-100 text-slate-700 border-slate-200/80', icon: UserCheck },
    GUEST: { label: 'Khách', color: 'bg-slate-100 text-slate-600 border-slate-200/80', icon: UserCheck },
  };

  const currentRole = roleBadgeConfig[user.role] || roleBadgeConfig.MEMBER;
  const RoleIcon = currentRole.icon;

  const socialLinks = [
    { href: user.googleScholarUrl, label: 'Google Scholar', icon: GraduationCap },
    { href: user.githubUrl, label: 'GitHub', icon: Github },
    { href: user.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
    { href: user.portfolioUrl, label: 'Trang cá nhân', icon: Globe },
  ].filter(link => !!link.href);

  return <div className="flex min-h-screen flex-col"><Navbar />
    <main className="container mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ManagementHeader title={isOwnProfile ? 'Hồ sơ của tôi' : 'Hồ sơ thành viên'} description={isOwnProfile ? 'Thông tin cá nhân và các công trình bạn đã tham gia.' : 'Giới thiệu và các công trình đã công bố của thành viên.'}>
        {isOwnProfile ? <Link href="/account/change-password" className="action-secondary-detail"><KeyRound aria-hidden="true" className="h-4 w-4" />Đổi mật khẩu</Link> : <Link href="/members" className="action-secondary-detail">Danh sách thành viên</Link>}
      </ManagementHeader>
      {isOwnProfile && <ManagementNav active="profile" userId={user.id} isAdmin={(session?.user as { role?: string } | undefined)?.role === 'ADMIN'} />}
      <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-32" aria-label="Thông tin thành viên">
          <section className="panel-detail !p-5 !shadow-none">
            <div className="mb-4 flex items-center gap-3">
              {user.avatarUrl ? <img src={user.avatarUrl} alt={`Ảnh của ${user.fullName}`} className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover" /> : <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl font-semibold text-[#0F294A]">{user.fullName.charAt(0)}</span>}
              <div className="min-w-0"><h2 className="break-words text-lg font-semibold leading-6 text-[#0F294A]">{user.fullName}</h2><span className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${currentRole.color}`}><RoleIcon aria-hidden="true" className="h-3.5 w-3.5" />{currentRole.label}</span></div>
            </div>
            <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-600">{user.bio || 'Chưa cập nhật giới thiệu.'}</p>
            <div className="panel-nested mt-5 grid grid-cols-2 gap-3 !border-0 !p-3 text-center">
              <div><p className="text-xl font-semibold tabular-nums text-[#0F294A]">{papers.length}</p><p className="mt-1 text-xs text-slate-500">Nghiên cứu</p></div>
              <div className="border-l border-slate-200"><p className="text-xl font-semibold tabular-nums text-[#0F294A]">{projects.length}</p><p className="mt-1 text-xs text-slate-500">Dự án</p></div>
            </div>
          </section>
          {socialLinks.length > 0 && <section className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="mb-2 text-sm font-semibold text-slate-900">Liên kết cá nhân</h2><div className="divide-y divide-slate-100">{socialLinks.map(({ href, label, icon: Icon }) => <a key={label} href={href!} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 text-sm text-slate-600 hover:text-[#0F294A]"><Icon aria-hidden="true" className="h-4 w-4" />{label}<ArrowRight aria-hidden="true" className="ml-auto h-3.5 w-3.5" /></a>)}</div></section>}
          {isOwnProfile && <Link href="/dashboard" className="action-secondary-detail w-full">Quản lý bài đăng<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
        </aside>
        <div className="min-w-0 space-y-8">
          {[{ id: 'research', label: 'Nghiên cứu khoa học', items: papers, icon: FileText }, { id: 'projects', label: 'Robotics & IoT', items: projects, icon: Code2 }].map(({ id: sectionId, label, items, icon }) => <section key={sectionId} id={sectionId} aria-labelledby={`${sectionId}-title`} className="scroll-mt-32">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3"><h2 id={`${sectionId}-title`} className="text-lg font-semibold text-[#0F294A]">{label}</h2><span className="text-xs text-slate-500">{items.length} công trình</span></div>
            {items.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{items.map(item => <ShowcaseCard key={item.id} item={item} />)}</div> : <EmptyState icon={icon} title="Chưa có công trình" description={isOwnProfile ? 'Các công trình đã xuất bản có bạn tham gia sẽ hiển thị tại đây.' : 'Thành viên chưa có công trình trong chuyên mục này.'} />}
          </section>)}
        </div>
      </div>
    </main><AcademicFooter /></div>;
}
