import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { SubmissionActionBar } from '@/features/submissions/components/submission-action-bar';
it('shows acknowledged save feedback and keeps preview icon visible at mobile sizes', () => {
 const html = renderToStaticMarkup(<SubmissionActionBar saveState="saved" onSave={()=>{}} onSubmit={()=>{}} onPreview={()=>{}} />);
 expect(html).toContain('Đã lưu');
 expect(html).toMatch(/lucide-eye[^>]*class="[^"]*"|class="[^"]*lucide-eye/);
 expect(html).not.toMatch(/class="[^"]*hidden[^"<>]*"[^>]*><path[^>]*d="M2/);
});
it('does not block submission while background saving because submit must flush the queue', () => {
 const html = renderToStaticMarkup(<SubmissionActionBar saveState="saving" onSave={()=>{}} onSubmit={()=>{}} onPreview={()=>{}} />);
 expect(html).not.toContain('disabled=""');
});
