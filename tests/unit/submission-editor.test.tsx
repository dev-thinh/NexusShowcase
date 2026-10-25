import { createInitialSubmissionState, submissionEditorReducer } from '@/features/submissions/components/use-submission-editor';
import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/features/submissions/server/actions', () => ({
  saveShowcaseDraftAction: vi.fn(),
  submitShowcaseForReviewAction: vi.fn(),
}));

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('submission editor shell', () => {
  it('groups the abstract, contributors and section workspace with a shared preview', () => {
    const editor = read('src/features/submissions/components/submission-editor.tsx');
    expect(editor).toContain('panel-detail');
    expect(editor).toContain('SectionEditor');
    expect(editor).toContain('ArticleContent');
    expect(editor).toContain('Xem trước');
    expect(editor).toContain('ResourceEditor');
    expect(editor).toContain('Tài nguyên đính kèm');
    expect(editor).toContain("role: 'CONTRIBUTOR'");
  });

  it('uses compact contributor rows with member, external, and free-text role flows', () => {
    const contributors = read('src/features/submissions/components/contributor-editor.tsx');
    expect(contributors).toContain('Thêm thành viên CLB');
    expect(contributors).toContain('Thêm người bên ngoài');
    expect(contributors).toContain('customRoleTitle');
    expect(contributors).not.toContain('<select');
    expect(contributors).toContain('panel-nested');
    expect(contributors).toContain('aria-label');
    expect(contributors).not.toContain('rounded-xl');
  });

  it('adds one typed resource at a time with accessible file controls', () => {
    const resources = read('src/features/submissions/components/resource-editor.tsx');
    expect(resources).toContain('Thêm tài nguyên');
    expect(resources).toContain("add('DOCUMENT')");
    expect(resources).toContain('>Tệp</button>');
    expect(resources).not.toContain('Tài liệu PDF');
    expect(resources).toContain("add('LINK')");
    expect(resources).toContain('<FilePicker');
    expect(resources).toContain('aria-label={`Xóa tài nguyên');
    expect(resources).toContain('panel-nested');
    expect(resources).not.toMatch(/onClick=.*<div/);
  });

  it('associates sentence-case labels and field errors with stable ids', () => {
    const fields = read('src/features/submissions/components/basic-information-fields.tsx');
    expect(fields).toContain('htmlFor="submission-title"');
    expect(fields).toContain('id="submission-title"');
    expect(fields).toContain('aria-describedby');
    expect(fields.match(/aria-required="true" required/g)).toHaveLength(2);
    expect(fields).toContain('Tiêu đề');
    expect(fields).toContain('Tóm tắt');
    expect(fields).not.toContain('Gợi ý lĩnh vực');
    expect(fields).not.toContain('submission-custom-type');
  });

  it('defaults the year to the current year while preserving an existing year', () => {
    expect(createInitialSubmissionState({}).data.publishedYear).toBe(new Date().getFullYear());
    expect(createInitialSubmissionState({ publishedYear: 2024 }).data.publishedYear).toBe(2024);
  });

  it('tracks title-only drafts and save state through the reducer', () => {
    const initial = createInitialSubmissionState({ title: '', summary: '', contributors: [], resources: [] });
    const edited = submissionEditorReducer(initial, { type: 'field', field: 'title', value: 'Robot tự hành' });
    expect(edited.data.title).toBe('Robot tự hành');
    expect(edited.isDirty).toBe(true);
    expect(submissionEditorReducer(edited, { type: 'saving' }).saveState).toBe('saving');
    expect(submissionEditorReducer(edited, { type: 'saved', itemId: 'item-1', reviewVersion: 1, editSequence: edited.editSequence }).isDirty).toBe(false);
  });

  it('preserves edits made while an older save was pending', () => {
    const state = createInitialSubmissionState({ id: 'item', reviewVersion: 2, title: 'Old' });
    const edited = submissionEditorReducer(state, { type: 'field', field: 'title', value: 'New' });
    const saved = submissionEditorReducer(edited, { type: 'saved', itemId: 'item', reviewVersion: 3, editSequence: state.editSequence });
    expect(saved.data.title).toBe('New');
    expect(saved.isDirty).toBe(true);
    expect(saved.reviewVersion).toBe(3);
    expect(saved.saveState).toBe('idle');
    const failed = submissionEditorReducer(saved, { type: 'failed', error: 'Network error' });
    expect(failed.data.title).toBe('New');
    expect(failed.isDirty).toBe(true);
  });

  it('shows explicit save states in a responsive action bar', () => {
    const actions = read('src/features/submissions/components/submission-action-bar.tsx');
    expect(actions).toContain('Chưa lưu');
    expect(actions).toContain('Đang lưu…');
    expect(actions).toContain("saved: ''");
    expect(actions).toContain('Lưu thất bại');
    expect(actions).toContain('sticky bottom-0');
    expect(actions).not.toContain('fixed');
    expect(actions).toContain('action-secondary-detail');
    expect(actions).toContain('action-primary-detail');
  });
});
