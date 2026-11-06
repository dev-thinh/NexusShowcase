
import { getServerI18n } from '@/shared/i18n/server';
import { AdminTabs } from '@/app/(shell)/_components/admin-tabs';
import { getActor } from '@/features/identity/server/actor';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t: tr } = await getServerI18n();

  const actor = await getActor(undefined, { allowPasswordChangeRequired: true });
  if (!actor) redirect('/login');
  if (actor.role !== 'ADMIN') redirect('/');
  if (actor.mustChangePassword) redirect('/account/change-password');
  return <main className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8" data-admin-workspace="true">
    <Breadcrumbs items={[{ label: 'Quản trị' }]} />
    <header className="mb-5">
      <h1 className="page-title">{tr("Quản trị")}</h1>
      <p className="mt-1 text-sm text-slate-500">{tr("Quản lý hoạt động và nội dung của CLB.")}</p>
    </header>
    <Suspense fallback={<div className="mb-6 flex h-12 gap-5 overflow-hidden border-b border-slate-200" aria-hidden="true">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-24 shrink-0" />)}</div>}><AdminTabs /></Suspense>
    <div id="admin-tab-content" className="min-w-0">{children}</div>
  </main>;
}
