import { expect,it } from 'vitest';
import { canReviewItem } from '@/features/submissions/model/workflow-state';
import { pendingReviewWhere } from '@/features/review/model/review-state';
import { matchesPostFilter } from '@/features/submissions/model/dashboard-items';
it('treats legacy ready published updates as reviewable, withdrawable and pending',()=>{
 const item={status:'PUBLISHED',reviewStatus:'READY_FOR_APPROVAL',title:'Legacy',summary:''} as const;
 expect(canReviewItem(item)).toBe(true);
 expect(pendingReviewWhere.OR).toContainEqual({status:'PUBLISHED',reviewStatus:{in:['PENDING_REVIEW','READY_FOR_APPROVAL']}});
 expect(matchesPostFilter(item,'PENDING_REVIEW')).toBe(true);
});
