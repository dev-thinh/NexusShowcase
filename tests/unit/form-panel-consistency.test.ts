import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

describe('form and modal panel consistency', () => {
  it('keeps the author fields and section inputs at a consistent readable size', () => {
    for (const file of ['src/features/submissions/components/basic-information-fields.tsx', 'src/features/submissions/components/section-editor.tsx']) {
      const content = read(file);
      expect(content).toContain('rounded-md');
      expect(content).toContain('px-3 py-2.5 text-sm');
    }
  });

  it('uses a read-only article preview with separate admin decision controls', () => {
    const preview = read('src/features/submissions/components/submission-preview.tsx');
    expect(preview).toContain('ArticleContent');
    expect(preview).not.toMatch(/<input|<textarea/);
    expect(read('src/features/review/components/approval-controls.tsx')).toContain('Quyết định phê duyệt');
  });
  it.each([
    'src/features/identity/components/login-form.tsx',
    'src/features/identity/components/change-password-form.tsx',
  ])('uses a detail form shell in %s', (file) => {
    expect(read(file)).toContain('panel-detail');
  });

  it('uses a continuous document surface for the item editor', () => {
    const editor = read('src/features/submissions/components/submission-editor.tsx');
    expect(editor).toContain('panel-detail');
    expect(editor).toContain('lg:divide-x');
    expect(editor).not.toContain('panel-operational');
  });

  it('defines shared modal regions', () => {
    const modal = read('src/shared/ui/modal.tsx');
    expect(modal).toContain('modal-header');
    expect(modal).toContain('modal-body');
  });

  it.each([
    'src/features/publications/components/citation-modal.tsx',
    'src/features/identity/components/admin-create-member-modal.tsx',
    'src/features/identity/components/admin-delete-member-modal.tsx',
  ])('uses a separated modal footer in %s', (file) => {
    expect(read(file)).toContain('modal-footer');
  });
});
