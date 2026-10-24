import { StatusBadge, TypeBadge } from '@/features/publications/components/badges';
import { ItemStatus, ItemType } from '@prisma/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('TypeBadge shape', () => {
  it('shows only the two supported labels without decorative icons', () => {
    const research = renderToStaticMarkup(<TypeBadge type={ItemType.RESEARCH_PAPER} />);
    const robotics = renderToStaticMarkup(<TypeBadge type={ItemType.PROJECT} />);
    expect(research).toContain('Nghiên cứu khoa học');
    expect(robotics).toContain('Robotics &amp; IoT');
    expect(research).not.toContain('<svg');
    expect(robotics).not.toContain('<svg');
  });

  it('uses a restrained card-like radius without changing status badge pills', () => {
    const typeBadge = renderToStaticMarkup(<TypeBadge type={ItemType.RESEARCH_PAPER} />);
    const statusBadge = renderToStaticMarkup(<StatusBadge status={ItemStatus.PUBLISHED} />);

    expect(typeBadge).toContain('rounded-md');
    expect(typeBadge).not.toContain('rounded-full');
    expect(statusBadge).toContain('rounded-full');
  });
});
