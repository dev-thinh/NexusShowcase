import { getActor } from '@/features/identity/server/actor';
import { redirect } from 'next/navigation';

export async function WorkspaceAccess({ children }: { children: React.ReactNode }) {
  const actor = await getActor(undefined, { allowPasswordChangeRequired: true });
  if (!actor) redirect('/login');
  if (actor.mustChangePassword) redirect('/account/change-password');
  return children;
}
