'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShowcaseDraftAction } from '../server/actions';

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
          try { if (window.sessionStorage.getItem(key) === mutationId) window.sessionStorage.removeItem(key); } catch {}
          router.replace(`/dashboard/items/${result.data.id}/edit`);
        } catch { if (active) setError('Chưa tạo được bản nháp. Kiểm tra kết nối và thử lại.'); }
        finally { pending = false; if (active) setBusy(false); }
      });
    };
    runRef.current = create; create();
    return () => { active = false; };
  }, [accountId, router]);
  return <section aria-live="polite" className="panel-detail space-y-4">
    {busy && <p>Đang tạo bản nháp…</p>}
    {error && <><p role="alert">{error}</p><button type="button" className="action-primary-detail" disabled={busy} onClick={() => runRef.current()}>Thử lại</button></>}
  </section>;
}
