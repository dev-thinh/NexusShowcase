import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/app/dashboard/items/[id]/edit/page.tsx'), 'utf8');

describe('member edit route guards', () => {
  it('allows only draft and revision-requested records into the member editor', () => {
    expect(source).toContain("['DRAFT', 'REVISION_REQUESTED'].includes(item.status)");
    expect(source).toContain("redirect('/dashboard')");
  });

  it('preserves ownership and forced-password checks', () => {
    expect(source).toContain('item.creatorId !== user.id');
    expect(source).toContain('user.mustChangePassword');
  });
});
