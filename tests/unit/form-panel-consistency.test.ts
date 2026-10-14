import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

describe('form and modal panel consistency', () => {
  it.each([
    'src/app/login/login-form.tsx',
    'src/components/contact-form.tsx',
    'src/components/change-password-form.tsx',
  ])('uses a detail form shell in %s', (file) => {
    expect(read(file)).toContain('panel-detail');
  });

  it('uses operational grouping for the item editor', () => {
    expect(read('src/components/item-form.tsx')).toContain('panel-operational');
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
