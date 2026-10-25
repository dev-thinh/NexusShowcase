import { expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { normalizeAssetReferenceText } from '@/features/assets/server/references';

async function claimedAsset(name: string) {
  return prisma.asset.create({ data: { url: `/uploads/thumbnails/${name}.png`, provider: 'imagekit', fileId: name, deletionToken: `claim-${name}`, deletionStartedAt: new Date() } });
}

it('rejects direct and encoded references to claimed assets', async () => {
  const asset = await claimedAsset('guard-direct');
  const variants = [asset.url, asset.url.replaceAll('/', '%2F'), asset.url.replaceAll('/', '%252F'), asset.url.replaceAll('/', String.raw`\u002f`), asset.url.replaceAll('/', '&#47;'), asset.url.replaceAll('/', '&#x2f;')];
  for (let index = 0; index < variants.length; index++) {
    await expect(prisma.homeMomentsGallery.create({ data: { id: `blocked-${index}`, photos: [variants[index]] } })).rejects.toThrow();
  }
  expect(await prisma.homeMomentsGallery.count()).toBe(0);
});

it('allows unrelated encoded text when deleted assets exist', async () => {
  const asset = await claimedAsset('guard-deleted');
  await prisma.asset.update({ where: { id: asset.id }, data: { deletedAt: new Date() } });
  const user = await prisma.user.create({ data: { email: 'encoded-text@nexus.test', fullName: 'Encoded text', bio: String.raw`A%20B &#65; \u0041` } });
  expect(user.bio).toBe(String.raw`A%20B &#65; \u0041`);
});

it('normalizes nested encodings consistently with canonical managed paths', async () => {
  const result = await prisma.$queryRaw<Array<{ value: string }>>`SELECT normalize_asset_reference_text(${String.raw`%252Fuploads&#47;documents\u002Fa.pdf`}) AS value`;
  expect(result[0].value).toBe('/uploads/documents/a.pdf');
});

it('normalizes named HTML entities consistently in inventory and database guards', async () => {
  const encoded = '&amp;sol;uploads&sol;thumbnails&sol;named&lowbar;asset&UnderBar;fj&fjlig;&period;png&quest;v&equals;1&amp;x&equals;%32&num;preview&colon;&commat;&percnt;&bsol;';
  const expected = '/uploads/thumbnails/named_asset_fjfj.png?v=1&x=2#preview:@%\\';
  expect(normalizeAssetReferenceText(encoded)).toEqual({ text: expected, incomplete: false });
  const result = await prisma.$queryRaw<Array<{ value: string }>>`SELECT normalize_asset_reference_text(${encoded}) AS value`;
  // SQL strips remaining JSON backslashes conservatively after decoding.
  expect(result[0].value).toBe(expected.slice(0, -1));
});

it('rejects named-entity HTML references written after an asset is claimed', async () => {
  const asset = await claimedAsset('named_entity');
  const encoded = asset.url.replaceAll('/', '&amp;sol;').replaceAll('_', '&UnderBar;').replaceAll('.', '&period;');
  await expect(prisma.user.create({ data: { email: 'named-entity@nexus.test', fullName: 'Named entity', bio: `<img src="${encoded}">` } })).rejects.toThrow();
  expect(await prisma.user.findUnique({ where: { email: 'named-entity@nexus.test' } })).toBeNull();
});

it('rejects a reference writer racing a committed cleanup claim', async () => {
  const asset = await prisma.asset.create({ data: { url: '/uploads/thumbnails/race.png', provider: 'imagekit', fileId: 'race' } });
  let claimLocked!: () => void, releaseClaim!: () => void;
  const locked = new Promise<void>(resolve => { claimLocked = resolve; });
  const released = new Promise<void>(resolve => { releaseClaim = resolve; });
  const claiming = prisma.$transaction(async tx => {
    await tx.asset.update({ where: { id: asset.id }, data: { deletionToken: 'race-claim', deletionStartedAt: new Date() } });
    claimLocked();
    await released;
  });
  await locked;
  const writing = prisma.homeMomentsGallery.create({ data: { id: 'race-writer', photos: [asset.url] } });
  // Attach rejection handling before releasing the claimant's exclusive lock.
  const rejected = expect(writing).rejects.toThrow();
  releaseClaim();
  await claiming;
  await rejected;
  expect(await prisma.homeMomentsGallery.findUnique({ where: { id: 'race-writer' } })).toBeNull();
});
