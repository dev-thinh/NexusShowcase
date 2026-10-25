import { AdminTabs } from '@/app/(shell)/_components/admin-tabs';
import { getActor } from '@/features/identity/server/actor';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor(undefined, { allowPasswordChangeRequired: true });
  if (!actor) redirect('/login');
  if (actor.role !== 'ADMIN') redirect('/');
  if (actor.mustChangePassword) redirect('/account/change-password');
  return <main className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8" data-admin-workspace="true">
    <Breadcrumbs items={[{ label: 'Quản trị' }]} />
    <header className="mb-5">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Quản trị</h1>
      <p className="mt-1 text-sm text-slate-500">Quản lý hoạt động và nội dung của CLB.</p>
    </header>
    <Suspense fallback={<div className="mb-6 h-12 border-b border-slate-200" />}><AdminTabs /></Suspense>
    <div id="admin-tab-content" className="min-w-0">{children}</div>
  </main>;
}
