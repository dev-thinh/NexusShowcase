import { createMemberInputSchema, userRoleUpdateInputSchema } from '@/features/identity/model/member-input';
import { showcaseDraftInputSchema } from '@/features/submissions/model/input';
import { expect, it } from 'vitest';
it.each(['javascript:alert(1)', 'data:text/html,unsafe', '/uploads/../secret.pdf'])('rejects unsafe resource URL %s', url => {
  expect(showcaseDraftInputSchema.safeParse({ title: 'Draft', resources: [{ kind: 'LINK', label: 'Resource', url }] }).success).toBe(false);
});
it('rejects the retired editor role and forged role update IDs', () => {
  expect(createMemberInputSchema.safeParse({ fullName: 'Name', email: 'member', role: 'EDITOR' }).success).toBe(false);
  expect(userRoleUpdateInputSchema.safeParse({ targetUserId: 'forged', newRole: 'ADMIN' }).success).toBe(false);
});
