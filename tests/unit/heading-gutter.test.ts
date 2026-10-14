import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const headingSources = [
  'src/app/page.tsx',
  'src/app/category/[slug]/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/members/page.tsx',
  'src/app/members/all/page.tsx',
  'src/app/members/[id]/page.tsx',
  'src/app/showcase/[slug]/page.tsx',
  'src/app/dashboard/items/new/page.tsx',
  'src/app/dashboard/items/[id]/edit/page.tsx',
  'src/components/change-password-form.tsx',
  'src/components/contact-form.tsx',
  'src/components/featured-filmstrip.tsx',
  'src/components/item-form.tsx',
  'src/components/member-section-heading.tsx',
];

describe('sitewide heading alignment', () => {
  it.each(headingSources)('%s keeps decorative icons out of headings', (file) => {
    const content = readFileSync(resolve(process.cwd(), file), 'utf8');

    expect(content).not.toContain('heading-gutter-icon');
  });

  it('aligns member directory content with the footer container', () => {
    const members = readFileSync(
      resolve(process.cwd(), 'src/app/members/page.tsx'),
      'utf8',
    );
    const allMembers = readFileSync(
      resolve(process.cwd(), 'src/app/members/all/page.tsx'),
      'utf8',
    );

    expect(members).toContain('max-w-7xl');
    expect(allMembers).toContain('max-w-7xl');
    expect(members).not.toContain('max-w-6xl');
    expect(allMembers).not.toContain('max-w-6xl');
  });
});
