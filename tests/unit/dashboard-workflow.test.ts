import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('member workflow dashboard', () => {
  it('defines member-facing labels for every workflow status', () => {
    const badge = read('src/components/ui/badge.tsx');
    for (const status of ['DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'READY_FOR_APPROVAL', 'REJECTED', 'PUBLISHED', 'ARCHIVED']) {
      expect(badge).toContain(`${status}:`);
    }
  });

  it('offers editing only for drafts and requested revisions', () => {
    const dashboard = read('src/app/dashboard/page.tsx');
    expect(dashboard).toContain("['DRAFT', 'REVISION_REQUESTED'].includes(item.status)");
    expect(dashboard).toContain("item.status === 'REJECTED'");
    expect(dashboard).toContain('Chỉ đọc');
  });

  it('loads only author-facing comments for the edit route', () => {
    const route = read('src/app/dashboard/items/[id]/edit/page.tsx');
    expect(route).toContain("audience: 'AUTHOR'");
    expect(route).not.toContain("audience: 'EDITORIAL'");
    expect(route).toContain('reviewComments');
  });

  it('connects field feedback with aria-describedby', () => {
    const comments = read('src/components/submission/review-comments.tsx');
    const fields = read('src/components/submission/basic-information-fields.tsx');
    expect(comments).toContain('review-comment-');
    expect(comments).toContain("comment.audience !== 'AUTHOR'");
    expect(fields).toContain('commentDescriptionId');
    expect(fields).toContain('aria-describedby');
  });
});
