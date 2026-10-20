import { describe, expect, it } from 'vitest';
import { bulkPostInputSchema } from '@/lib/bulk-posts';
const a = 'cjr012345678901234567890';
const b = 'cjr012345678901234567891';
describe('bulk post input', () => {
  it('deduplicates selected and replaced posts', () => {
    expect(bulkPostInputSchema.parse({ itemIds: [a, a], replaceItemIds: [b, b], action: 'PIN' })).toEqual({ itemIds: [a], replaceItemIds: [b], action: 'PIN' });
  });
  it.each([
    { itemIds: [], action: 'PUBLIC' },
    { itemIds: ['bad-id'], action: 'PUBLIC' },
    { itemIds: Array(51).fill(a), action: 'PUBLIC' },
    { itemIds: [a], action: 'TOGGLE' },
    { itemIds: [a], action: 'PIN_PUBLIC' },
    { itemIds: [a], action: 'PUBLIC', replaceItemIds: [b] },
    { itemIds: [a], action: 'PIN', replaceItemIds: [a] },
    { itemIds: [a], action: 'PIN', status: 'PUBLISHED' },
  ])('rejects invalid or ambiguous requests: %j', input => {
    expect(bulkPostInputSchema.safeParse(input).success).toBe(false);
  });
});
