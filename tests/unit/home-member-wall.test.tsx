import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeMemberWall } from '@/features/members/components/home-member-wall';

const member = (index: number) => ({ id: `m${index}`, fullName: `Thành viên ${index}`, avatarUrl: null, role: 'MEMBER' as const });

describe('homepage member wall', () => {
  it('shows a compact avatar list without biographies or contribution cards', () => {
    const html = renderToStaticMarkup(<HomeMemberWall members={[member(1), member(2)]} total={2} />);
    expect(html.match(/data-home-member-avatar="true"/g)).toHaveLength(2);
    expect(html).toContain('2 thành viên');
    expect(html).not.toContain('home-member-more');
    expect(html).not.toContain('panel-public');
    expect(html).not.toContain('công trình');
  });
  it('counts the hidden members from the actual number of avatars', () => {
    const html = renderToStaticMarkup(<HomeMemberWall members={Array.from({ length: 29 }, (_, index) => member(index))} total={50} />);
    expect(html).toContain('+21');
    expect(html).toContain('href="/members"');
    expect(html).toContain('Xem tất cả');
  });
  it('shows the empty state without creating placeholder people', () => {
    const html = renderToStaticMarkup(<HomeMemberWall members={[]} total={0} />);
    expect(html).not.toContain('data-home-member-avatar');
    expect(html).toContain('đang được cập nhật');
  });
});
