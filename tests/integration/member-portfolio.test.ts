import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Member Automatic Portfolio', () => {
  it('should find items where member is tagged as contributor', async () => {
    const regularMember = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
    if (!regularMember) throw new Error('Member not found');

    const contributions = await prisma.itemContributor.findMany({
      where: {
        userId: regularMember.id,
        item: { status: 'PUBLISHED' },
      },
      include: {
        item: true,
      },
    });

    expect(contributions.length).toBeGreaterThan(0);
    expect(contributions[0].item.title).toContain('ViMed-Seg');
  });
});
