import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { MemberAvatar } from '@/shared/ui/member-avatar';

it('uses one uppercase initial of the final word, including Vietnamese accents', () => {
  const html = renderToStaticMarkup(<MemberAvatar fullName={'  Nguyễn Bảo   ánh  '} />);
  expect(html).toContain('>Á</span>');
});

it('uses a letter rather than punctuation when the last word is parenthesized', () => {
  expect(renderToStaticMarkup(<MemberAvatar fullName="Quản Trị Viên (Admin)" />)).toContain('>A</span>');
});

it('lets layout classes size the fallback instead of forcing image pixel dimensions', () => {
  const html = renderToStaticMarkup(<MemberAvatar fullName="Nguyễn Bảo Nhi" width={76} height={76} className="h-full w-full rounded-full" />);
  expect(html).not.toContain('width:76px');
  expect(html).not.toContain('height:76px');
  expect(html).toContain('h-full w-full');
});

it('shows an uploaded image when provided', () => {
  const html = renderToStaticMarkup(<MemberAvatar fullName="Nguyễn Bảo Nhi" src="/avatar.jpg" />);
  expect(html).toContain('<img');
  expect(html).not.toContain('data-member-avatar-fallback');
});

it('renders a fixed member color immediately and keeps it after a fresh module load', async () => {
  const first = renderToStaticMarkup(<MemberAvatar fullName="Nguyễn Bảo Nhi" />);
  expect(first).toMatch(/background-color:hsl\(/);
  vi.resetModules();
  const { MemberAvatar: FreshAvatar } = await import('@/shared/ui/member-avatar');
  expect(renderToStaticMarkup(<FreshAvatar fullName="Nguyễn Bảo Nhi" />)).toBe(first);
});

it('assigns different member names their own fixed colors', () => {
  const color = (fullName: string) => renderToStaticMarkup(<MemberAvatar fullName={fullName} />).match(/background-color:([^;]+)/)?.[1];
  expect(color('Nguyễn Bảo Nhi')).not.toBe(color('Trần Minh Anh'));
  expect(color('  Nguyễn   Bảo Nhi  ')).toBe(color('Nguyễn Bảo Nhi'));
});
