import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Item Form Component', () => {
  it('supports mediaDriveUrl, tags, and category proposal', () => {
    const formPath = path.resolve(process.cwd(), 'src/components/item-form.tsx');
    const content = fs.readFileSync(formPath, 'utf-8');

    expect(content).toContain('mediaDriveUrl');
    expect(content).toContain('proposedCategory');
    expect(content).toContain('tags');
  });
});
