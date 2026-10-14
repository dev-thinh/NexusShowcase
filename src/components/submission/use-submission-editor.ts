'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { saveShowcaseDraftAction, submitShowcaseForReviewAction } from '@/actions/showcase-actions';
import type { ShowcaseDraftInput } from '@/lib/action-schemas';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface SubmissionEditorState {
  itemId: string | null;
  data: ShowcaseDraftInput;
  fieldErrors: Record<string, string[]>;
  saveState: SaveState;
  isDirty: boolean;
  formError: string | null;
}

export type SubmissionEditorAction =
  | { type: 'field'; field: keyof ShowcaseDraftInput; value: ShowcaseDraftInput[keyof ShowcaseDraftInput] }
  | { type: 'saving' }
  | { type: 'saved'; itemId: string }
  | { type: 'failed'; error: string; fieldErrors?: Record<string, string[]> }
  | { type: 'errors'; error: string; fieldErrors?: Record<string, string[]> };

export function createInitialSubmissionState(
  initialData: Partial<ShowcaseDraftInput> & { id?: string }
): SubmissionEditorState {
  return {
    itemId: initialData.id ?? null,
    data: {
      title: initialData.title ?? '',
      summary: initialData.summary ?? '',
      content: initialData.content ?? '',
      publishedYear: initialData.publishedYear,
      suggestedField: initialData.suggestedField ?? '',
      customProjectType: initialData.customProjectType ?? '',
      contributors: initialData.contributors ?? [],
      resources: initialData.resources ?? [],
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
        formError: null,
      };
    case 'saving':
      return { ...state, saveState: 'saving', formError: null };
    case 'saved':
      return { ...state, itemId: action.itemId, saveState: 'saved', isDirty: false, fieldErrors: {}, formError: null };
    case 'failed':
      return { ...state, saveState: 'error', fieldErrors: action.fieldErrors ?? {}, formError: action.error };
    case 'errors':
      return { ...state, fieldErrors: action.fieldErrors ?? {}, formError: action.error };
  }
}

export function useSubmissionEditor(initialData: Partial<ShowcaseDraftInput> & { id?: string }) {
  const [state, dispatch] = useReducer(submissionEditorReducer, initialData, createInitialSubmissionState);

  useEffect(() => {
    if (!state.isDirty) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [state.isDirty]);

  const updateField = useCallback(<K extends keyof ShowcaseDraftInput>(field: K, value: ShowcaseDraftInput[K]) => {
    dispatch({ type: 'field', field, value });
  }, []);

  const saveDraft = useCallback(async () => {
    dispatch({ type: 'saving' });
    const result = await saveShowcaseDraftAction(state.itemId, state.data);
    if (!result.success) {
      dispatch({ type: 'failed', error: result.error, fieldErrors: result.fieldErrors });
      return null;
    }
    dispatch({ type: 'saved', itemId: result.data.id });
    return result.data.id;
  }, [state.data, state.itemId]);

  const submitForReview = useCallback(async () => {
    const itemId = await saveDraft();
    if (!itemId) return false;
    const result = await submitShowcaseForReviewAction(itemId);
    if (!result.success) {
      dispatch({ type: 'errors', error: result.error, fieldErrors: result.fieldErrors });
      return false;
    }
    return true;
  }, [saveDraft]);

  return { state, updateField, saveDraft, submitForReview };
}
