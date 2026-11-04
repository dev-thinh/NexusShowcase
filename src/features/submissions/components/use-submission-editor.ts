'use client';

import { submissionValidationMessage, submissionFieldErrors } from '@/features/submissions/model/validation-result';

import { articleFromLegacy, serializeArticle, standaloneResources } from '@/features/submissions/model/article';
import type { ShowcaseDraftInput } from '@/features/submissions/model/input';
import { showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
import { saveShowcaseDraftAction, submitShowcaseForReviewAction } from '@/features/submissions/server/actions';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef, useState, startTransition } from 'react';
import { notifySuccess } from '@/shared/dialogs/success';

import { DraftSaveCoordinator, type SaveSnapshot, type SaveState } from './draft-save-coordinator';
import { chooseDraftRecovery, listRecoveries, removeRecovery, writeRecovery, type DraftRecovery } from './draft-recovery';
export type { SaveState } from './draft-save-coordinator';

export interface SubmissionEditorState {
  itemId: string | null;
  reviewVersion?: number;
  editSequence: number;
  data: ShowcaseDraftInput;
  fieldErrors: Record<string, string[]>;
  saveState: SaveState;
  isDirty: boolean;
  formError: string | null;
}

export type SubmissionEditorAction =
  | { type: 'snapshot'; snapshot: SaveSnapshot }
  | { type: 'field'; field: keyof ShowcaseDraftInput; value: ShowcaseDraftInput[keyof ShowcaseDraftInput] }
  | { type: 'saving' }
  | { type: 'saved'; itemId: string; reviewVersion: number; editSequence: number }
  | { type: 'failed'; error: string; fieldErrors?: Record<string, string[]> }
  | { type: 'errors'; error: string; fieldErrors?: Record<string, string[]> };

export function createInitialSubmissionState(
  initialData: Partial<ShowcaseDraftInput> & { id?: string; reviewVersion?: number; draftSnapshot?: boolean }
): SubmissionEditorState {
  return {
    itemId: initialData.id ?? null,
    reviewVersion: initialData.reviewVersion,
    editSequence: 0,
    data: {
      citationEnabled: initialData.citationEnabled ?? Boolean(initialData.id),
      conference: initialData.conference ?? null,
      title: initialData.title ?? '',
      summary: initialData.summary ?? '',
      content: initialData.draftSnapshot ? (initialData.content ?? '') : serializeArticle(articleFromLegacy(initialData.content ?? '')),
      type: initialData.type ?? 'PROJECT',
      categoryId: initialData.categoryId ?? null,
      thumbnailUrl: initialData.thumbnailUrl ?? null,
      publishedYear: initialData.publishedYear ?? new Date().getFullYear(),
      suggestedField: initialData.suggestedField ?? '',
      customProjectType: initialData.customProjectType ?? '',
      contributors: initialData.contributors ?? [],
      resources: initialData.draftSnapshot ? (initialData.resources ?? []) : standaloneResources(initialData.content ?? '', initialData.resources ?? []),
    },
    fieldErrors: {},
    saveState: initialData.id ? 'saved' : 'idle',
    isDirty: false,
    formError: null,
  };
}

export function submissionEditorReducer(
  state: SubmissionEditorState,
  action: SubmissionEditorAction
): SubmissionEditorState {
  switch (action.type) {
    case 'snapshot':
      return { ...state, data: action.snapshot.data, reviewVersion: action.snapshot.reviewVersion, editSequence: action.snapshot.editSequence, isDirty: action.snapshot.isDirty, saveState: action.snapshot.status };
    case 'field':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        fieldErrors: Object.fromEntries(Object.entries(state.fieldErrors).filter(([key]) => key !== action.field && !key.startsWith(`${action.field}.`))),
        saveState: 'idle',
        isDirty: true,
        editSequence: state.editSequence + 1,
        formError: null,
      };
    case 'saving':
      return { ...state, saveState: 'saving', formError: null };
    case 'saved':
      return { ...state, itemId: action.itemId, reviewVersion: action.reviewVersion,
        saveState: state.editSequence === action.editSequence ? 'saved' : 'idle',
        isDirty: state.editSequence !== action.editSequence, fieldErrors: {}, formError: null };
    case 'failed':
      return { ...state, saveState: 'error', fieldErrors: action.fieldErrors ?? {}, formError: action.error };
    case 'errors':
      return { ...state, fieldErrors: action.fieldErrors ?? {}, formError: action.error };
  }
}

export function useSubmissionEditor(initialData: Partial<ShowcaseDraftInput> & { id?: string; reviewVersion?: number; draftSnapshot?: boolean }, accountId: string) {
  const router = useRouter();
  const [state, dispatch] = useReducer(submissionEditorReducer, initialData, createInitialSubmissionState);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recoveries, setRecoveries] = useState<DraftRecovery[]>([]);
  const [storageError, setStorageError] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const coordinatorRef = useRef<DraftSaveCoordinator | null>(null);
  const activeRecordRef = useRef<DraftRecovery | null>(null);
  const initialRef = useRef({ data: state.data, itemId: initialData.id, version: initialData.reviewVersion ?? 0, accountId });
  const busyRef = useRef(false);
  const recoveryPendingRef = useRef(false);

  useEffect(() => {
    const initial = initialRef.current;
    if (!initial.itemId) return;
    let existing: DraftRecovery[] = [];
    try {
      const result = listRecoveries(window.localStorage, initial.accountId, initial.itemId);
      existing = result.records; setStorageError(result.error);
    } catch { setStorageError(true); }
    const recovery = chooseDraftRecovery(existing, initial.data, initial.version);
    for (const obsolete of recovery.obsolete) {
      try { removeRecovery(window.localStorage, obsolete); } catch {}
    }
    recoveryPendingRef.current = recovery.conflicts.length > 0;
    setRecoveries(recovery.conflicts);
    const sessionId = crypto.randomUUID();
    const coordinator = new DraftSaveCoordinator({
      itemId: initial.itemId, reviewVersion: initial.version, data: initial.data,
      save: input => new Promise((resolve, reject) => {
        startTransition(async () => { try { resolve(await saveShowcaseDraftAction(input)); } catch (error) { reject(error); } });
      }),
      persist: snapshot => {
        try {
          if (!snapshot.isDirty) {
            const previous = activeRecordRef.current;
            if (previous && !removeRecovery(window.localStorage, previous)) return false;
            activeRecordRef.current = null; return true;
          }
          const record: DraftRecovery = { format: 1, accountId: initial.accountId, itemId: initial.itemId!, sessionId,
            expectedReviewVersion: snapshot.reviewVersion, editSequence: snapshot.editSequence, updatedAt: Date.now(), data: snapshot.data, pendingMutation: snapshot.pendingMutation };
          activeRecordRef.current = record;
          return writeRecovery(window.localStorage, record);
        } catch { return false; }
      },
      onChange: snapshot => {
        dispatch({ type: 'snapshot', snapshot });
        setStorageError(!snapshot.locallySaved); setSaveNotice(snapshot.error);
      },
    });
    coordinatorRef.current = coordinator;
    const online = () => coordinator.setOnline(navigator.onLine);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (coordinator.snapshot.isDirty && !coordinator.snapshot.locallySaved) event.preventDefault();
    };
    // Set connectivity before restoring so offline recovery never depends on a request.
    online();
    if (recovery.resume) {
      const record = recovery.resume;
      coordinator.restore(record.data, record.expectedReviewVersion, record.editSequence, record.pendingMutation);
      if (coordinator.snapshot.locallySaved) {
        try { removeRecovery(window.localStorage, record); } catch {}
      }
    }
    window.addEventListener('online', online); window.addEventListener('offline', online);
    window.addEventListener('beforeunload', beforeUnload);
    setReady(true);
    return () => {
      coordinator.dispose(); coordinatorRef.current = null;
      window.removeEventListener('online', online); window.removeEventListener('offline', online); window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);

  const updateField = useCallback(<K extends keyof ShowcaseDraftInput>(field: K, value: ShowcaseDraftInput[K]) => {
    const coordinator = coordinatorRef.current;
    if (!coordinator || busyRef.current || recoveryPendingRef.current) return;
    const data = { ...coordinator.snapshot.data, [field]: value };
    dispatch({ type: 'field', field, value });
    coordinator.update(data);
  }, []);

  const saveDraft = useCallback(async () => {
    if (recoveryPendingRef.current) return null;
    return coordinatorRef.current?.retry() ?? null;
  }, []);

  const discardRecovery = useCallback((record: DraftRecovery) => {
    let removed = false;
    try { removed = removeRecovery(window.localStorage, record); } catch {}
    if (!removed) { setStorageError(true); return; }
    setRecoveries(current => {
      const next = current.filter(entry => entry.sessionId !== record.sessionId);
      recoveryPendingRef.current = next.length > 0;
      return next;
    });
  }, []);

  const restoreRecovery = useCallback((record: DraftRecovery) => {
    const coordinator = coordinatorRef.current;
    if (!coordinator || (record.expectedReviewVersion !== initialRef.current.version && !record.pendingMutation)) return;
    coordinator.restore(record.data, record.expectedReviewVersion, record.editSequence, record.pendingMutation);
    // Copy into this tab's own durable record before removing the old session.
    if (coordinator.snapshot.locallySaved) {
      try { removeRecovery(window.localStorage, record); } catch {}
    }
    recoveryPendingRef.current = false;
    setRecoveries([]);
  }, []);

  const submitForReview = useCallback(async () => {
    const coordinator = coordinatorRef.current;
    if (!coordinator || busyRef.current || recoveryPendingRef.current) return false;
    const parsed = showcaseSubmissionInputSchema.safeParse(coordinator.snapshot.data);
    if (!parsed.success) {
      dispatch({ type: 'errors', error: submissionValidationMessage(parsed.error), fieldErrors: submissionFieldErrors(parsed.error) });
      return false;
    }
    busyRef.current = true; setSubmitting(true);
    try {
      const saved = await coordinator.retry();
      if (!saved || coordinator.snapshot.isDirty || saved.editSequence !== coordinator.snapshot.editSequence) return false;
      const result = await submitShowcaseForReviewAction({ itemId: saved.id, expectedReviewVersion: saved.reviewVersion });
      if (!result.success) {
        dispatch({ type: 'failed', error: result.error, fieldErrors: result.fieldErrors }); return false;
      }
      coordinator.dispose();
      await notifySuccess('Đã gửi công trình để xét duyệt.');
      router.replace('/my-works'); return true;
    } catch {
      dispatch({ type: 'failed', error: 'Không gửi được bài. Bản nháp đã lưu vẫn được giữ lại.' }); return false;
    } finally { busyRef.current = false; setSubmitting(false); }
  }, [router]);

  return { state, updateField, saveDraft, submitForReview, ready, submitting, recoveries, restoreRecovery, discardRecovery, storageError, saveNotice,
    activeRecovery: state.saveState === 'conflict' || storageError ? activeRecordRef.current : null };
}
