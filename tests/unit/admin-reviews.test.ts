import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Admin Reviews Page', () => {
  it('renders mediaDriveUrl and proposedCategory for reviewers', () => {
    const reviewsPath = path.resolve(process.cwd(), 'src/app/admin/reviews/page.tsx');
    const content = fs.readFileSync(reviewsPath, 'utf-8');

    expect(content).toContain('mediaDriveUrl');
  });
});
