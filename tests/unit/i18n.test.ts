import { describe, expect, it } from 'vitest';
import { createTranslator, parseLocale, LOCALE_COOKIE } from '@/shared/i18n/core';

describe('VI/EN translation', () => {
  it('defaults to Vietnamese and accepts only supported locale values', () => {
    expect(LOCALE_COOKIE).toBe('nexus-locale');
    expect(parseLocale('en')).toBe('en');
    for (const value of ['vi', 'fr', '', undefined, '<script>']) expect(parseLocale(value)).toBe('vi');
  });
  it('translates interface copy and preserves unknown strings', () => {
    expect(createTranslator('en')('Đăng nhập')).toBe('Sign in');
    expect(createTranslator('vi')('Đăng nhập')).toBe('Đăng nhập');
    expect(createTranslator('en')('Robot tự hành của Nguyễn An')).toBe('Robot tự hành của Nguyễn An');
  });
  it('interpolates user-supplied values without translating their content or treating replacement tokens as code', () => {
    const t = createTranslator('en');
    expect(t('Xem công trình: {0}', 'Nghiên cứu khoa học $&')).toBe('View work: Nghiên cứu khoa học $&');
    expect(createTranslator('vi')('Xem công trình: {0}', 'Tên bài')).toBe('Xem công trình: Tên bài');
  });
  it('localizes formatted server messages using the same templates', () => {
    expect(createTranslator('en')('Kích thước tệp quá lớn (9MB). Giới hạn tối đa là 5MB.')).toBe('The file is too large (9MB). The maximum size is 5MB.');
  });
});
