import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

describe('form and modal panel consistency', () => {
  it('aligns the editorial workspace with shared panel and action tokens', () => {
    const workspace = read('src/components/editorial/review-workspace.tsx');
    const sourceView = read('src/components/editorial/source-revision-view.tsx');
    expect(workspace).toContain('panel-detail');
    expect(sourceView).toContain('panel-nested');
    expect(workspace).toContain('action-primary-detail');
    expect(workspace).toContain('action-secondary-detail');
  });
  it.each([
    'src/app/login/login-form.tsx',
    'src/components/contact-form.tsx',
    'src/components/change-password-form.tsx',
  ])('uses a detail form shell in %s', (file) => {
    expect(read(file)).toContain('panel-detail');
  });

  it('uses a continuous document surface for the item editor', () => {
    const editor = read('src/components/submission/submission-editor.tsx');
    expect(editor).toContain('panel-detail');
    expect(editor).toContain('lg:divide-x');
    expect(editor).not.toContain('panel-operational');
  });

  it('defines shared modal regions', () => {
    const modal = read('src/components/ui/modal.tsx');
    expect(modal).toContain('modal-header');
    expect(modal).toContain('modal-body');
  });

  it.each([
    'src/components/citation-modal.tsx',
    'src/components/admin-create-member-modal.tsx',
    'src/components/admin-delete-member-modal.tsx',
  ])('uses a separated modal footer in %s', (file) => {
    expect(read(file)).toContain('modal-footer');
  });
});
