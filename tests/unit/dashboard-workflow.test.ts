import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('member workflow dashboard', () => {
  it('defines member-facing labels for every workflow status', () => {
    const badge = read('src/features/publications/components/badges.tsx');
    expect(badge).toContain('getItemStatusLabel(status)');
  });

  it('offers editing only for drafts and requested revisions', () => {
    const dashboard = read('src/features/submissions/components/my-posts.tsx');
    expect(dashboard).toContain("['DRAFT', 'REVISION_REQUESTED'].includes(item.status)");
    expect(dashboard).toContain("item.status === 'REJECTED'");
    expect(dashboard).toContain('Chỉ đọc');
  });

  it('loads only author-facing comments for the edit route', () => {
    const route = read('src/app/(shell)/(account)/dashboard/items/[id]/edit/page.tsx');
    expect(route).toContain("audience: 'AUTHOR'");
    expect(route).not.toContain("audience: 'EDITORIAL'");
    expect(route).toContain('reviewComments');
  });

  it('connects field feedback with aria-describedby', () => {
    const comments = read('src/features/submissions/components/review-comments.tsx');
    const fields = read('src/features/submissions/components/basic-information-fields.tsx');
    expect(comments).toContain('review-comment-');
    expect(comments).toContain("comment.audience !== 'AUTHOR'");
    expect(fields).toContain('commentDescriptionId');
    expect(fields).toContain('aria-describedby');
  });
});
