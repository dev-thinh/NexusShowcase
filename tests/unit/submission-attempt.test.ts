import {expect,it} from 'vitest';
import {readSubmissionAttempt,writeSubmissionAttempt,clearSubmissionAttempt} from '@/features/submissions/components/submission-attempt';
const id='cjr012345678901234567890';
function storage(){const m=new Map<string,string>();return{getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},removeItem:(k:string)=>{m.delete(k);}};}
it('retains the same uncertain request across reload and isolates accounts',()=>{
 const s=storage();const attempt={itemId:id,expectedReviewVersion:3,mutationId:crypto.randomUUID()};
 expect(writeSubmissionAttempt(s,'author',attempt)).toBe(true);
 expect(readSubmissionAttempt(s,'author',id,3)).toEqual(attempt);
 expect(readSubmissionAttempt(s,'other',id,3)).toBeNull();
 expect(readSubmissionAttempt(s,'author',id,4)).toBeNull();
});
it('does not clear another newer submission attempt on an old response',()=>{
 const s=storage();const first={itemId:id,expectedReviewVersion:3,mutationId:crypto.randomUUID()};const next={...first,mutationId:crypto.randomUUID()};
 writeSubmissionAttempt(s,'author',next); clearSubmissionAttempt(s,'author',first);
 expect(readSubmissionAttempt(s,'author',id,3)).toEqual(next);
});
it('only unlocks an explicit validation rejection at the same editable server version',async()=>{
 const {mayResumeAfterSubmissionRejection}=await import('@/features/submissions/components/submission-attempt');
 const attempt={itemId:id,expectedReviewVersion:3,mutationId:crypto.randomUUID()};
 expect(mayResumeAfterSubmissionRejection('VALIDATION',attempt,{editable:true,reviewVersion:3})).toBe(true);
 for(const code of ['UNAUTHORIZED','FORBIDDEN','CONFLICT','INTERNAL']) expect(mayResumeAfterSubmissionRejection(code,attempt,{editable:true,reviewVersion:3})).toBe(false);
 expect(mayResumeAfterSubmissionRejection('VALIDATION',attempt,{editable:false,reviewVersion:4})).toBe(false);
 expect(mayResumeAfterSubmissionRejection('VALIDATION',attempt,null)).toBe(false);
});
