import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), 'utf8');

describe('sitewide public panel audit', () => {
  it.each([
    'src/app/(shell)/(site)/category/[slug]/page.tsx',
  ])('%s uses the shared public panel treatment', (path) => {
    expect(source(path)).toContain('panel-public');
  });

  it('member directory reuses the compact homepage avatar wall', () => {
    const members = source('src/app/(shell)/(site)/members/page.tsx');
    expect(members).toContain('<HomeMemberWall');
    expect(members).not.toContain('<MemberCard');
  });

  it('shared empty states use the nested panel treatment', () => {
    expect(source('src/shared/ui/empty-state.tsx')).toContain('panel-nested');
  });
});
