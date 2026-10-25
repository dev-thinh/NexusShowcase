import { ProfileAvatar } from '@/features/identity/components/profile-avatar';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { publicUserSelect } from '@/features/identity/model/public-user';
import { ProfileEditor } from '@/features/identity/components/profile-editor';
import { ProfileBio } from '@/features/identity/components/profile-bio';
import { ChangePasswordModal } from '@/features/identity/components/change-password-modal';
import { getProfileLinks } from '@/features/identity/model/profile-input';
import { TypeBadge } from '@/features/publications/components/badges';
import { uploadAvatarAction, removeAvatarAction } from '@/features/assets/server/avatar-actions';
import { getSession as auth } from '@/features/identity/server/session';
import { MediaImage } from '@/shared/ui/media-image';
import { listMemberPublications } from '@/features/publications/server/queries';
import { prisma } from '@/server/db/prisma';
import { MemberPagination } from '@/shared/ui/member-pagination';
import { ArrowUpRight, ShieldCheck, UserCheck } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MemberProfilePage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string; password?: string; researchPage?: string; projectPage?: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isOwnProfile = session?.user?.id === id;
  const user = await prisma.user.findUnique({ where: { id, status: 'ACTIVE', deletedAt: null }, select: publicUserSelect });
  if (!user) notFound();
  const query = await searchParams ?? {};
  const publications = await listMemberPublications({ memberId: id, authenticated: !!session?.user, page: query.page ?? query.researchPage ?? query.projectPage, pageSize: 6 });
  const basePath = '/members/' + id;

  const roleBadgeConfig = {
    ADMIN: { label: 'Quản trị viên', color: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200', icon: ShieldCheck },
    CORE_MEMBER: { label: 'Thành viên chủ chốt', color: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200', icon: UserCheck },
    EDITOR: { label: 'Thành viên', color: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200', icon: UserCheck },
    MEMBER: { label: 'Thành viên', color: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200', icon: UserCheck },
    GUEST: { label: 'Khách', color: 'bg-[#FFFFFF] text-[#1F2937] border-slate-200', icon: UserCheck },
  };

  const currentRole = roleBadgeConfig[user.role] || roleBadgeConfig.MEMBER;
  const RoleIcon = currentRole.icon;

  const socialLinks = getProfileLinks(user);
  const profile = { fullName: user.fullName, bio: user.bio ?? '', links: socialLinks };

  return (
    <main className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Breadcrumbs items={[{ label: 'Thành viên', href: '/members' }, { label: isOwnProfile ? 'Hồ sơ của tôi' : user.fullName }]} />

      <section aria-label="Thông tin thành viên" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <ProfileAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} uploadAction={isOwnProfile ? uploadAvatarAction : undefined} removeAction={isOwnProfile ? removeAvatarAction : undefined} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="break-words font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{user.fullName}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"><RoleIcon aria-hidden="true" className="h-3.5 w-3.5" />{currentRole.label}</span>
            </div>
            {user.bio ? <ProfileBio text={user.bio} /> : <p className="mt-2 text-sm text-slate-500">Chưa cập nhật giới thiệu.</p>}
            {socialLinks.length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Liên kết cá nhân">
              {socialLinks.map(({ url, title }, index) => <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 max-w-full items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/30"><span className="truncate">{title}</span></a>)}
            </div>}
          </div>
          {isOwnProfile && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
            <ProfileEditor profile={profile} />
            <ChangePasswordModal autoOpen={query.password === 'change'} required={!!session?.user?.mustChangePassword} />
          </div>}
        </div>
      </section>

      <section className="mt-7" aria-label="Công trình của thành viên">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">Công trình<span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm tabular-nums text-slate-600">{publications.total}</span></h2>{publications.total > 0 && <p className="text-sm text-slate-500">Hiển thị {(publications.page - 1) * 6 + 1}–{Math.min(publications.page * 6, publications.total)} / {publications.total}</p>}</div>
        {publications.items.length ? <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {publications.items.map(item => <Link key={item.id} href={`/showcase/${item.slug}`} className="group flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67]/30 sm:gap-4 sm:px-5">
            {item.thumbnailUrl && <MediaImage src={item.thumbnailUrl} alt="" width={64} height={64} loading="lazy" className="hidden h-16 w-16 shrink-0 rounded-lg border border-slate-100 object-cover sm:block" />}
            <div className="min-w-0 flex-1">
              <div className="mb-1"><TypeBadge type={item.type} size="sm" /></div>
              <h3 className="line-clamp-2 break-words text-sm font-semibold leading-6 text-slate-900 group-hover:text-[#153D67] sm:text-base">{item.title}</h3>
              {item.summary && <p className="mt-1 line-clamp-1 break-words text-sm text-slate-500">{item.summary}</p>}
            </div>
            {item.publishedYear && <span className="shrink-0 text-xs tabular-nums text-slate-500 sm:text-sm">{item.publishedYear}</span>}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#153D67]" />
          </Link>)}
        </div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-5 py-8 text-center"><p className="text-sm text-slate-500">Chưa có công trình nào.</p></div>}
        {publications.totalPages > 1 && <div className="mt-5"><MemberPagination page={publications.page} totalPages={publications.totalPages} basePath={basePath} ariaLabel="Phân trang công trình" /></div>}
      </section>
    </main>
  );
}
