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
  'src/components/submission/submission-editor.tsx',
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

describe('footer content alignment', () => {
  const gutters = ['container', 'mx-auto', 'max-w-7xl', 'px-4', 'sm:px-6', 'lg:px-8'];
  const files = [
    'src/app/page.tsx', 'src/app/category/[slug]/page.tsx', 'src/app/contact/page.tsx',
    'src/app/admin/page.tsx', 'src/app/admin/members/page.tsx', 'src/app/admin/reviews/page.tsx',
    'src/app/admin/reviews/[id]/page.tsx', 'src/app/dashboard/page.tsx',
    'src/app/dashboard/items/new/page.tsx', 'src/app/dashboard/items/[id]/edit/page.tsx',
    'src/app/members/page.tsx', 'src/app/members/all/page.tsx', 'src/app/members/[id]/page.tsx',
    'src/app/login/page.tsx', 'src/app/account/change-password/page.tsx', 'src/app/showcase/[slug]/page.tsx',
  ];
  it.each(files)('%s matches the footer width and responsive gutters', file => {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    const main = source.slice(source.indexOf('<main'));
    const containers = [...main.matchAll(/className="([^"]*\bcontainer\b[^"]*)"/g)].map(match => match[1].split(/\s+/));
    expect(containers.some(classes => gutters.every(token => classes.includes(token)))).toBe(true);
  });
  it('lets the submission form fill its aligned page container', () => {
    for (const file of ['src/app/dashboard/items/new/page.tsx', 'src/app/dashboard/items/[id]/edit/page.tsx', 'src/components/submission/submission-editor.tsx']) {
      expect(readFileSync(resolve(process.cwd(), file), 'utf8')).not.toContain('max-w-6xl');
    }
  });
});
