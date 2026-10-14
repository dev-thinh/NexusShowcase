import { describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createInitialSubmissionState, submissionEditorReducer } from '@/components/submission/use-submission-editor';

vi.mock('server-only', () => ({}));
vi.mock('@/actions/showcase-actions', () => ({
  saveShowcaseDraftAction: vi.fn(),
  submitShowcaseForReviewAction: vi.fn(),
}));

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('submission editor shell', () => {
  it('uses one continuous academic form with three unnumbered sections', () => {
    const editor = read('src/components/submission/submission-editor.tsx');
    expect(editor).toContain('max-w-4xl');
    expect(editor).toContain('divide-y divide-slate-200');
    expect(editor).toContain('Thông tin cơ bản');
    expect(editor).toContain('Tác giả và người đóng góp');
    expect(editor).toContain('Tài nguyên và thông tin bổ sung');
    expect(editor).not.toContain('panel-operational');
    expect(editor).not.toMatch(/Bước\s*[123]|0[123]\./);
    expect(editor).not.toMatch(/categoryId|layoutType|emoji/i);
  });

  it('associates sentence-case labels and field errors with stable ids', () => {
    const fields = read('src/components/submission/basic-information-fields.tsx');
    expect(fields).toContain('htmlFor="submission-title"');
    expect(fields).toContain('id="submission-title"');
    expect(fields).toContain('aria-describedby');
    expect(fields).toContain('Tiêu đề');
    expect(fields).toContain('Tóm tắt');
    expect(fields).toContain('Gợi ý lĩnh vực');
  });

  it('tracks title-only drafts and save state through the reducer', () => {
    const initial = createInitialSubmissionState({ title: '', summary: '', contributors: [], resources: [] });
    const edited = submissionEditorReducer(initial, { type: 'field', field: 'title', value: 'Robot tự hành' });
    expect(edited.data.title).toBe('Robot tự hành');
    expect(edited.isDirty).toBe(true);
    expect(submissionEditorReducer(edited, { type: 'saving' }).saveState).toBe('saving');
    expect(submissionEditorReducer(edited, { type: 'saved', itemId: 'item-1' }).isDirty).toBe(false);
  });

  it('shows explicit save states in a responsive action bar', () => {
    const actions = read('src/components/submission/submission-action-bar.tsx');
    expect(actions).toContain('Chưa lưu');
    expect(actions).toContain('Đang lưu…');
    expect(actions).toContain('Đã lưu');
    expect(actions).toContain('Lưu thất bại');
    expect(actions).toContain('sm:sticky');
    expect(actions).not.toContain('fixed');
  });
});
