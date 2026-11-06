'use client';
import { useI18n } from '@/shared/i18n/provider';


import { startTransition, useEffect, useRef, useState } from 'react';
import { createShowcaseDraftAction } from '../server/actions';
import { SubmissionWorkspaceLoading } from '@/shared/ui/submission-workspace-loading';
import { SubmissionEditor, type SubmissionEditorProps } from './submission-editor';

/** Mounted only on an intentional /new visit; prefetch/render cannot create data. */
export function NewDraft({ accountId, currentUser, categories }: { accountId: string } & Pick<SubmissionEditorProps, 'currentUser' | 'categories'>) {
  const { t: tr } = useI18n();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [created, setCreated] = useState<{ id: string; reviewVersion: number } | null>(null);
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
          // The empty draft and editor options are already known. Updating the
          // URL in place avoids a second server render before typing can start.
          window.history.replaceState(null, '', `/my-works/${result.data.id}/edit`);
          setCreated({ id: result.data.id, reviewVersion: result.data.reviewVersion });
          try { if (window.sessionStorage.getItem(key) === mutationId) window.sessionStorage.removeItem(key); } catch {}
        } catch { if (active) setError('Chưa tạo được bản nháp. Kiểm tra kết nối và thử lại.'); }
        finally { pending = false; if (active) setBusy(false); }
      });
    };
    runRef.current = create; create();
    return () => { active = false; };
  }, [accountId]);
  if (created) return <SubmissionEditor key={`${accountId}:${created.id}`} currentUser={currentUser} categories={categories} clubMembers={[{ id: currentUser.id, fullName: currentUser.fullName }]} initialData={{ ...created, draftSnapshot: true, title: '', citationEnabled: false, contributors: [{ userId: accountId, role: 'CONTRIBUTOR', displayOrder: 0 }] }} />;
  return <section aria-live="polite" className="space-y-4">
    {busy && !error && <SubmissionWorkspaceLoading />}
    {error && <><p role="alert">{tr(error)}</p><button type="button" className="action-primary-detail" disabled={busy} onClick={() => runRef.current()}>{tr("Thử lại")}</button></>}
  </section>;
}
