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
    expect(editor).toContain('panel-detail');
    expect(editor).toContain('lg:grid-cols-[minmax(0,7fr)_minmax(20rem,5fr)]');
    expect(editor).toContain('lg:divide-x');
    expect(editor).toContain('Thông tin cơ bản');
    expect(editor).toContain('Tác giả và người đóng góp');
    expect(editor).toContain('Tài nguyên đính kèm');
    expect(editor).toContain('Trình bày ngắn gọn vấn đề nghiên cứu, phương pháp và đóng góp chính.');
    expect(editor).toContain('Thêm người tham gia và xác định vai trò.');
    expect(editor).toContain('Bổ sung hình ảnh, PDF hoặc liên kết cần thiết.');
    expect(editor).not.toContain('cho quá trình thẩm định');
    expect(editor).not.toContain('panel-operational');
    expect(editor).not.toMatch(/Bước\s*[123]|0[123]\./);
    expect(editor).not.toMatch(/categoryId|layoutType|emoji/i);
  });

  it('uses compact contributor rows with member, external, and optional role flows', () => {
    const contributors = read('src/components/submission/contributor-editor.tsx');
    expect(contributors).toContain('Thêm thành viên CLB');
    expect(contributors).toContain('Thêm người bên ngoài');
    expect(contributors).toContain('Vai trò chi tiết');
    expect(contributors).toContain('panel-nested');
    expect(contributors).toContain('aria-label');
    expect(contributors).not.toContain('rounded-xl');
  });

  it('adds one typed resource at a time with accessible file controls', () => {
    const resources = read('src/components/submission/resource-editor.tsx');
    expect(resources).toContain('Thêm tài nguyên');
    expect(resources).toContain("add('IMAGE')");
    expect(resources).toContain("add('DOCUMENT')");
    expect(resources).toContain("add('LINK')");
    expect(resources).toContain('type="file"');
    expect(resources).toContain('aria-label={`Xóa tài nguyên');
    expect(resources).toContain('panel-nested');
    expect(resources).not.toMatch(/onClick=.*<div/);
  });

  it('keeps advanced fields inside an optional details disclosure', () => {
    const optional = read('src/components/submission/optional-details.tsx');
    expect(optional).toContain('<details');
    expect(optional).toContain('Nội dung chi tiết');
    expect(optional).not.toContain('Google Drive');
    expect(optional).toContain('Markdown');
  });

  it('associates sentence-case labels and field errors with stable ids', () => {
    const fields = read('src/components/submission/basic-information-fields.tsx');
    expect(fields).toContain('htmlFor="submission-title"');
    expect(fields).toContain('id="submission-title"');
    expect(fields).toContain('aria-describedby');
    expect(fields.match(/aria-required="true" required/g)).toHaveLength(2);
    expect(fields).toContain('Tiêu đề');
    expect(fields).toContain('Tóm tắt');
    expect(fields).toContain('Gợi ý lĩnh vực');
  });

  it('marks contributors as required for submission', () => {
    const editor = read('src/components/submission/submission-editor.tsx');
    expect(editor).toContain('Bắt buộc khi gửi');
    expect(editor).toContain('aria-hidden="true">*</span>');
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
    expect(actions).toContain('action-secondary-detail');
    expect(actions).toContain('action-primary-detail');
  });
});
