import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Admin Reviews Page', () => {
  it('implements compact editorial queues linking to detail review workspace', () => {
    const reviewsPath = path.resolve(process.cwd(), 'src/app/admin/reviews/page.tsx');
    const content = fs.readFileSync(reviewsPath, 'utf-8');

    // Authorizes both EDITOR and ADMIN
    expect(content).toContain("getCurrentUser(['ADMIN'])");

    // Links to dedicated continuous review workspace /admin/reviews/[id]
    expect(content).toContain('/admin/reviews/${item.id}');

    // Direct publish/reject buttons removed from queue rows
    expect(content).not.toContain('AdminReviewButton');
    expect(content).not.toContain('action-row-card');

    // Supports editorial queues (PENDING_REVIEW and READY_FOR_APPROVAL)
    expect(content).toContain('pendingReviewWhere');
    expect(content).not.toContain('assignedEditor');
  });
});
