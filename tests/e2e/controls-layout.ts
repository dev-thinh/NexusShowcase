import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function auditControls(page: Page, context: string) {
  if (await page.getByRole('dialog').count() === 0) await expect(page.locator('h1').first()).toBeAttached();
  await expect(page.locator('[data-skeleton-layout]:not([data-deferred-section] [data-skeleton-layout])')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const issues = await page.evaluate(() => {
    const failures: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) failures.push('page overflow');
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[hidden], [aria-hidden="true"]');
    };
    const controls = [...document.querySelectorAll<HTMLElement>('button, [role="combobox"], .action-primary-detail, .action-secondary-detail, .admin-member-role, .admin-member-joined, .admin-navigation a, nav a.inline-flex')].filter(visible);
    for (const element of controls) {
      if (element.closest('.moment-photo, .moments-editor__slot, .moments-editor__asset-select')) continue;
      const rect = element.getBoundingClientRect();
      const label = (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 90);
      if (rect.left < -1 || rect.right > innerWidth + 1) failures.push(`viewport: ${label}`);
      for (const icon of element.querySelectorAll<SVGElement>(':scope > svg')) {
        if (getComputedStyle(icon).display === 'none') continue;
        const iconRect = icon.getBoundingClientRect();
        if (iconRect.width < 1 || iconRect.height < 1) failures.push(`collapsed icon: ${label}`);
      }
      // Avatar camera badges intentionally extend past the circular image.
      const floatingBadge = element.querySelector(':scope > [aria-hidden="true"][class*="-right-"]');
      if (!floatingBadge && element.scrollWidth > element.clientWidth + 2) failures.push(`clipped control: ${label}`);
      if (!floatingBadge && element.scrollHeight > element.clientHeight + 2) failures.push(`clipped height: ${label}`);
      if (element.matches('button, [role="combobox"], .action-primary-detail, .action-secondary-detail, .admin-navigation a, nav a.inline-flex') && !element.querySelector('img, [role="img"]')) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const textRects: DOMRect[] = [];
        let maximumLineHeight = 0;
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const parent = node.parentElement;
          if (!node.textContent?.trim() || !parent || parent.closest('.sr-only, [aria-hidden="true"], svg')) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          textRects.push(...Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0));
          maximumLineHeight = Math.max(maximumLineHeight, parseFloat(getComputedStyle(parent).lineHeight) || parseFloat(getComputedStyle(parent).fontSize) * 1.4);
        }
        if (textRects.length && Math.max(...textRects.map(rect => rect.bottom)) - Math.min(...textRects.map(rect => rect.top)) > maximumLineHeight + 2) failures.push(`multiline button: ${label}`);
      }
    }
    for (const group of document.querySelectorAll<HTMLElement>('[data-file-picker], .moments-editor__library-actions, .moments-editor__footer-actions, .admin-bulk-actions, .modal-footer')) {
      if (!visible(group)) continue;
      const bounds = group.getBoundingClientRect();
      for (const child of group.querySelectorAll<HTMLElement>('button, [role="combobox"]')) {
        if (!visible(child)) continue;
        const rect = child.getBoundingClientRect();
        if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) failures.push(`toolbar: ${(child.textContent || '').trim().slice(0, 90)}`);
      }
    }
    for (const row of document.querySelectorAll<HTMLElement>('.admin-member-row')) {
      const role = row.querySelector<HTMLElement>('.admin-member-role');
      const actions = row.querySelector<HTMLElement>('.admin-member-actions');
      if (role && actions && role.getBoundingClientRect().right > actions.getBoundingClientRect().left - 2) failures.push('member role overlaps actions');
    }
    return [...new Set(failures)];
  });
  expect(issues, context).toEqual([]);
}
