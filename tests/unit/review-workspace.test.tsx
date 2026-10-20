import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('academic review workspace', () => {
  it('uses localized status presentation instead of rendering the raw enum', () => {
    const workspace = read('src/components/editorial/review-workspace.tsx');
    const showcase = read('src/app/showcase/[slug]/page.tsx');
    expect(workspace).toContain('<StatusBadge status={item.status}');
    expect(workspace).not.toMatch(/>\s*\{item\.status\}\s*</);
    expect(showcase).toContain('<StatusBadge status={item.status}');
  });

  it('uses a 40/60 continuous desktop grid with divider and mobile tabs', () => {
    const workspace = read('src/components/editorial/review-workspace.tsx');
    expect(workspace).toMatch(/grid.*lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,3fr\)\]|grid.*lg:grid-cols-5|lg:divide-x/);
    expect(workspace).toContain('role="tab"');
    expect(workspace).toContain('aria-selected');
    expect(workspace).not.toContain('panel-operational');
  });

  it('renders read-only source revision view without editable inputs', () => {
    const sourceView = read('src/components/editorial/source-revision-view.tsx');
    expect(sourceView).toContain('Bản gốc tác giả');
    expect(sourceView).not.toMatch(/<input|<textarea/);
    expect(sourceView).toContain('Tác giả');
    expect(sourceView).toContain('Tài nguyên');
    expect(sourceView).toContain("contrib.displayName ?? memberNamesById[contrib.userId ?? '']");
    expect(sourceView).not.toContain("contrib.externalName || contrib.userId");
    expect(sourceView).not.toContain('{res.url}');
    expect(sourceView).toContain('Xem tài nguyên');
    expect(sourceView).toContain('fieldKey="resources"');
  });

  it('provides concise per-field restore controls and category requirement', () => {
    const fields = read('src/components/editorial/editorial-fields.tsx');
    expect(fields).not.toContain('Đã biên tập');
    expect(fields).toContain('Khôi phục bản gốc');
    expect(fields).toContain('Chuyên mục');
    expect(fields).toContain('htmlFor="editorial-category"');
    expect(fields).not.toContain('panel-operational');
  });

  it('renders a compact review checklist with explicit verification items', () => {
    const checklist = read('src/components/editorial/review-checklist.tsx');
    expect(checklist).toContain('copyEdited');
    expect(checklist).toContain('mediaChecked');
    expect(checklist).toContain('metadataChecked');
    expect(checklist).toContain('type="checkbox"');
  });

  it('supports role-specific actions for EDITOR and ADMIN', () => {
    const workspace = read('src/components/editorial/review-workspace.tsx');
    expect(workspace).toContain('Gửi phê duyệt');
    expect(workspace).toContain('Trả lại biên tập');
    expect(workspace).toContain('Yêu cầu bổ sung');
    expect(workspace).toContain('Xem trước');
    expect(workspace).toContain('publishEditorialDraftAction');
    expect(workspace).toContain('Xuất bản');
    expect(workspace).toContain("const canEdit = currentUser.role === 'EDITOR'");
    expect(workspace).toContain("const isApproval = currentUser.role === 'ADMIN'");
    expect(workspace).toContain('{canEdit && (');
    expect(workspace).toContain("useState<ItemVisibility>('PRIVATE')");
    expect(workspace).toContain('Nội bộ');
    expect(workspace).toContain('Công khai');
  });

  it('lets an editor claim an unassigned pending review before editing', () => {
    const workspace = read('src/components/editorial/review-workspace.tsx');
    expect(workspace).toContain("const canClaim = currentUser.role === 'EDITOR'");
    expect(workspace).toContain('Nhận biên tập');
    expect(workspace).toContain('assignEditorAction(item.id, currentUser.id)');
    expect(workspace).toContain('Bài đang được một biên tập viên khác phụ trách.');
  });

  it('secures routes and provides editorial preview', () => {
    const reviewRoute = read('src/app/admin/reviews/[id]/page.tsx');
    const previewRoute = read('src/app/admin/reviews/[id]/preview/page.tsx');
    expect(reviewRoute).toContain("getCurrentUser(['ADMIN'])");
    expect(previewRoute).toContain('redirect(');
    expect(reviewRoute).toContain('ApprovalControls');
    expect(reviewRoute).toContain('SubmissionPreview');
  });
});
