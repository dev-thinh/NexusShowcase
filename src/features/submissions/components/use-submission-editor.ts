'use client';

import { articleFromLegacy, serializeArticle, standaloneResources } from '@/features/submissions/model/article';
import type { ShowcaseDraftInput } from '@/features/submissions/model/input';
import { saveShowcaseDraftAction, submitShowcaseForReviewAction } from '@/features/submissions/server/actions';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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
  | { type: 'field'; field: keyof ShowcaseDraftInput; value: ShowcaseDraftInput[keyof ShowcaseDraftInput] }
  | { type: 'saving' }
  | { type: 'saved'; itemId: string; reviewVersion: number; editSequence: number }
  | { type: 'failed'; error: string; fieldErrors?: Record<string, string[]> }
  | { type: 'errors'; error: string; fieldErrors?: Record<string, string[]> };

export function createInitialSubmissionState(
  initialData: Partial<ShowcaseDraftInput> & { id?: string; reviewVersion?: number }
): SubmissionEditorState {
  return {
    itemId: initialData.id ?? null,
    reviewVersion: initialData.reviewVersion,
    editSequence: 0,
    data: {
      title: initialData.title ?? '',
      summary: initialData.summary ?? '',
      content: serializeArticle(articleFromLegacy(initialData.content ?? '')),
      type: initialData.type ?? 'PROJECT',
      categoryId: initialData.categoryId ?? null,
      thumbnailUrl: initialData.thumbnailUrl ?? null,
      publishedYear: initialData.publishedYear ?? new Date().getFullYear(),
      suggestedField: initialData.suggestedField ?? '',
      customProjectType: initialData.customProjectType ?? '',
      contributors: initialData.contributors ?? [],
      resources: standaloneResources(initialData.content ?? '', initialData.resources ?? []),
    },
    fieldErrors: {},
    saveState: 'idle',
    isDirty: false,
    formError: null,
  };
}

export function submissionEditorReducer(
  state: SubmissionEditorState,
  action: SubmissionEditorAction
): SubmissionEditorState {
  switch (action.type) {
    case 'field':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        fieldErrors: { ...state.fieldErrors, [action.field]: [] },
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

export function useSubmissionEditor(initialData: Partial<ShowcaseDraftInput> & { id?: string; reviewVersion?: number }) {
  const router = useRouter();
  const busyRef = useRef(false);
  const savingRef = useRef(false);
  const editSequenceRef = useRef(0);
  const [state, dispatch] = useReducer(submissionEditorReducer, initialData, createInitialSubmissionState);

  useEffect(() => {
    if (!state.isDirty) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [state.isDirty]);

  const updateField = useCallback(<K extends keyof ShowcaseDraftInput>(field: K, value: ShowcaseDraftInput[K]) => {
    editSequenceRef.current += 1;
    dispatch({ type: 'field', field, value });
  }, []);

  const saveDraft = useCallback(async () => {
    if (savingRef.current) return null;
    savingRef.current = true;
    const editSequence = state.editSequence;
    dispatch({ type: 'saving' });
    let result;
    try {
      result = await saveShowcaseDraftAction({ itemId: state.itemId, expectedReviewVersion: state.reviewVersion, draft: state.data });
    } catch {
      dispatch({ type: 'failed', error: 'Không lưu được. Kiểm tra kết nối và thử lại.' });
      return null;
    } finally { savingRef.current = false; }
    if (!result.success) {
      dispatch({ type: 'failed', error: result.error, fieldErrors: result.fieldErrors });
      return null;
    }
    dispatch({ type: 'saved', itemId: result.data.id, reviewVersion: result.data.reviewVersion, editSequence });
    return { ...result.data, editSequence };
  }, [state.data, state.itemId, state.reviewVersion, state.editSequence]);

  const submitForReview = useCallback(async () => {
    if (busyRef.current) return false;
    busyRef.current = true;
    try {
      const saved = await saveDraft();
      if (!saved) return false;
      if (editSequenceRef.current !== saved.editSequence) {
        dispatch({ type: 'errors', error: 'Nội dung vừa thay đổi. Vui lòng lưu lại trước khi gửi duyệt.' });
        return false;
      }
      dispatch({ type: 'saving' });
      const result = await submitShowcaseForReviewAction({ itemId: saved.id, expectedReviewVersion: saved.reviewVersion });
      if (!result.success) {
        dispatch({ type: 'failed', error: result.error, fieldErrors: result.fieldErrors });
        return false;
      }
      router.replace('/dashboard?submitted=1');
      return true;
    } catch {
      dispatch({ type: 'failed', error: 'Không gửi được bài. Bản nháp đã lưu vẫn được giữ lại.' });
      return false;
    } finally { busyRef.current = false; }
  }, [saveDraft, router]);

  return { state, updateField, saveDraft, submitForReview };
}
