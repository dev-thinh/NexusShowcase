'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShowcaseDraftAction } from '../server/actions';
import { SubmissionWorkspaceLoading } from '@/shared/ui/submission-workspace-loading';

/** Mounted only on an intentional /new visit; prefetch/render cannot create data. */
export function NewDraft({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const attemptRef = useRef<string | null>(null);
  const runRef = useRef<() => void>(() => {});
  useEffect(() => {
    let active = true;
    let pending = false;
    let routing = false;
    const key = `nexus:new-draft:${accountId}`;
    try { attemptRef.current ??= window.sessionStorage.getItem(key); } catch {}
    attemptRef.current ??= crypto.randomUUID();
    try { window.sessionStorage.setItem(key, attemptRef.current); } catch {}
    const create = () => {
      if (pending) return;
      pending = true; setBusy(true); setError(null);
      const mutationId = attemptRef.current!;
      startTransition(async () => {
        try {
          const result = await createShowcaseDraftAction({ mutationId });
          if (!active) return;
          if (!result.success) { setError(result.error); return; }
          routing = true;
          router.replace(`/my-works/${result.data.id}/edit`);
          // Keep this ID until the destination commits, including a reload while routing.
          // A later visit to /new starts a new attempt after this component unmounts.
        } catch { if (active) setError('Chưa tạo được bản nháp. Kiểm tra kết nối và thử lại.'); }
        finally { pending = false; if (active && !routing) setBusy(false); }
      });
    };
    runRef.current = create; create();
    return () => {
      active = false;
      if (routing) {
        try { if (window.sessionStorage.getItem(key) === attemptRef.current) window.sessionStorage.removeItem(key); } catch {}
      }
    };
  }, [accountId, router]);
  return <section aria-live="polite" className="space-y-4">
    {busy && !error && <SubmissionWorkspaceLoading />}
    {error && <><p role="alert">{error}</p><button type="button" className="action-primary-detail" disabled={busy} onClick={() => runRef.current()}>Thử lại</button></>}
  </section>;
}
