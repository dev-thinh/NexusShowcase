import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const headingSources = [
  'src/app/(shell)/(site)/page.tsx',
  'src/app/(shell)/(site)/category/[slug]/page.tsx',
  'src/app/(shell)/(site)/contact/page.tsx',
  'src/app/(shell)/(site)/members/page.tsx',
  'src/app/(shell)/(site)/members/all/page.tsx',
  'src/app/(shell)/(site)/members/[id]/page.tsx',
  'src/app/(shell)/(site)/showcase/[slug]/page.tsx',
  'src/app/(shell)/(account)/dashboard/items/new/page.tsx',
  'src/app/(shell)/(account)/dashboard/items/[id]/edit/page.tsx',
  'src/features/identity/components/change-password-form.tsx',
  'src/features/submissions/components/submission-editor.tsx',
  'src/features/members/components/member-section-heading.tsx',
];

describe('sitewide heading alignment', () => {
  it.each(headingSources)('%s keeps decorative icons out of headings', (file) => {
    const content = readFileSync(resolve(process.cwd(), file), 'utf8');

    expect(content).not.toContain('heading-gutter-icon');
  });

  it('aligns member directory content with the footer container', () => {
    const members = readFileSync(
      resolve(process.cwd(), 'src/app/(shell)/(site)/members/page.tsx'),
      'utf8',
    );
    const allMembers = readFileSync(
      resolve(process.cwd(), 'src/app/(shell)/(site)/members/all/page.tsx'),
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
    'src/app/(shell)/(site)/page.tsx', 'src/app/(shell)/(site)/category/[slug]/page.tsx', 'src/app/(shell)/(site)/contact/page.tsx',
    'src/app/(shell)/(account)/admin/page.tsx', 'src/app/(shell)/(account)/admin/members/page.tsx', 'src/app/(shell)/(account)/admin/reviews/page.tsx',
    'src/app/(shell)/(account)/admin/reviews/[id]/page.tsx', 'src/app/(shell)/(account)/dashboard/page.tsx',
    'src/app/(shell)/(account)/dashboard/items/new/page.tsx', 'src/app/(shell)/(account)/dashboard/items/[id]/edit/page.tsx',
    'src/app/(shell)/(site)/members/page.tsx', 'src/app/(shell)/(site)/members/all/page.tsx', 'src/app/(shell)/(site)/members/[id]/page.tsx',
    'src/app/(shell)/(auth)/login/page.tsx', 'src/app/(shell)/(account)/account/change-password/page.tsx', 'src/app/(shell)/(site)/showcase/[slug]/page.tsx',
  ];
  it.each(files)('%s matches the footer width and responsive gutters', file => {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    const main = source.slice(source.indexOf('<main'));
    const containers = [...main.matchAll(/className="([^"]*\bcontainer\b[^"]*)"/g)].map(match => match[1].split(/\s+/));
    expect(containers.some(classes => gutters.every(token => classes.includes(token)))).toBe(true);
  });
  it('lets the submission form fill its aligned page container', () => {
    for (const file of ['src/app/(shell)/(account)/dashboard/items/new/page.tsx', 'src/app/(shell)/(account)/dashboard/items/[id]/edit/page.tsx', 'src/features/submissions/components/submission-editor.tsx']) {
      expect(readFileSync(resolve(process.cwd(), file), 'utf8')).not.toContain('max-w-6xl');
    }
  });
});
