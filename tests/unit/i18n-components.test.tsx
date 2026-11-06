import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/shared/i18n/provider';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { CustomSelect } from '@/shared/ui/custom-select';
import { LanguageSwitch } from '@/shared/i18n/language-switch';
import { ErrorNotice } from '@/shared/ui/error-notice';

vi.unmock('@/shared/i18n/provider');
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

it('server-renders English controls and accessible labels from the initial locale', () => {
  const html = renderToStaticMarkup(<LocaleProvider initialLocale="en"><LanguageSwitch /><CustomSelect ariaLabel="Vai trò" value="CORE_MEMBER" options={[{ value: 'CORE_MEMBER', label: 'Trưởng nhóm' }]} /><ErrorNotice message="Không tải được nội dung." /></LocaleProvider>);
  expect(html).toContain('aria-checked="true"');
  expect(html).toContain('aria-label="Role"');
  expect(html).toContain('Team Leader');
  expect(html).toContain('Unable to load content.');
});

it('localizes breadcrumb interface labels while preserving an authored title matching a translation key', () => {
  const html = renderToStaticMarkup(<LocaleProvider initialLocale="en"><Breadcrumbs items={[{ label: 'Nghiên cứu khoa học', href: '/research' }, { label: 'Nghiên cứu khoa học', translate: false }]} /></LocaleProvider>);
  expect(html).toContain('Home');
  expect(html).toContain('Research');
  expect(html).toContain('aria-current="page"');
  expect(html).toContain('>Nghiên cứu khoa học</span>');
});
