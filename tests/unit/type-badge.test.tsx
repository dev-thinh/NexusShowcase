import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ItemStatus, ItemType } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { StatusBadge, TypeBadge } from '@/components/ui/badge';

describe('TypeBadge shape', () => {
  it('uses a restrained card-like radius without changing status badge pills', () => {
    const typeBadge = renderToStaticMarkup(<TypeBadge type={ItemType.RESEARCH_PAPER} />);
    const statusBadge = renderToStaticMarkup(<StatusBadge status={ItemStatus.PUBLISHED} />);

    expect(typeBadge).toContain('rounded-md');
    expect(typeBadge).not.toContain('rounded-full');
    expect(statusBadge).toContain('rounded-full');
  });
});
