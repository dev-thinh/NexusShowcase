import { expect, it } from 'vitest';
import { summarizeStorageUsage } from '../../src/features/assets/model/storage-usage';
it('counts unknown historical sizes conservatively, quarantine and pending reservations',()=>{
 expect(summarizeStorageUsage([{byteSize:10n,deletionStartedAt:null},{byteSize:null,deletionStartedAt:new Date()}],[{byteSize:20n}],100n)).toEqual({bytes:26214430n,files:3,pending:1,quarantined:1,unknownSizes:1,limitBytes:100n,percent:100});
});
