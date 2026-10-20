# Sitewide Panel Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize panel geometry, spacing, action-row separation, and button alignment across every NexusShowcase route while preserving a consistent density within each page family.

**Architecture:** Add semantic Tailwind component classes in `globals.css` as the shared source of truth, then migrate each page family to the appropriate public, detail, operational, form, or nested-panel variant. Keep specialized colors and layouts local; only shared surface geometry and action rhythm move into semantic classes.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, Tailwind CSS 3.4, Lucide React, Vitest 2

**Spec:** `docs/superpowers/specs/2026-10-14-sitewide-panel-consistency-design.md`

## Global Constraints

- Overall density is balanced: comfortably spaced public content and efficient operational screens.
- Public primary panels use `rounded-xl`; operational panels use `rounded-lg`; nested panels use `rounded-lg`.
- Public listing actions are 36px high; detail and primary form actions are 40px high.
- Card action rows use a divider plus 16px top separation; detail action rows use 20–24px separation.
- Standard icon-label gap is 8px; 6px is reserved for compact metadata controls.
- Decorative icons adjacent to visible labels use `aria-hidden="true"`.
- Do not change data queries, authorization, routes, navigation, content, or the existing palette.
- Preserve the user-owned untracked file `public/uploads/thumbnails/8a17a862-d811-4be2-959f-ab1c2ee03694.png`.

---

### Task 1: Semantic panel and action foundations

**Files:**
- Modify: `src/app/globals.css`
- Create: `tests/unit/panel-system.test.ts`

**Interfaces:**
- Produces CSS component classes: `.panel-public`, `.panel-operational`, `.panel-detail`, `.panel-nested`, `.panel-callout`, `.action-row-card`, `.action-row-detail`, `.action-primary-card`, `.action-secondary-card`, `.action-primary-detail`, and `.action-secondary-detail`.
- Later tasks consume these class names directly from JSX.

- [ ] **Step 1: Write the failing contract test**

Create `tests/unit/panel-system.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('sitewide panel system', () => {
  const css = fs.readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf-8');

  it.each([
    '.panel-public',
    '.panel-operational',
    '.panel-detail',
    '.panel-nested',
    '.panel-callout',
    '.action-row-card',
    '.action-row-detail',
    '.action-primary-card',
    '.action-secondary-card',
    '.action-primary-detail',
    '.action-secondary-detail',
  ])('defines %s', (className) => {
    expect(css).toContain(className);
  });

  it('keeps card and detail action heights distinct', () => {
    expect(css).toMatch(/\.action-primary-card[\s\S]*@apply[^;]*h-9/);
    expect(css).toMatch(/\.action-primary-detail[\s\S]*@apply[^;]*h-10/);
  });
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `npx vitest run tests/unit/panel-system.test.ts`

Expected: FAIL because the semantic classes do not exist.

- [ ] **Step 3: Add the semantic Tailwind component layer**

Append inside `src/app/globals.css`:

```css
@layer components {
  .panel-public {
    @apply rounded-xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6;
  }

  .panel-operational {
    @apply rounded-lg border border-slate-200 bg-white p-4 shadow-2xs sm:p-5;
  }

  .panel-detail {
    @apply rounded-xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8;
  }

  .panel-nested {
    @apply rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4;
  }

  .panel-callout {
    @apply rounded-lg border p-3 sm:p-4;
  }

  .action-row-card {
    @apply mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4;
  }

  .action-row-detail {
    @apply mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 sm:mt-6 sm:pt-6;
  }

  .action-primary-card {
    @apply inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0F294A] px-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/30;
  }

  .action-secondary-card {
    @apply inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/20;
  }

  .action-primary-detail {
    @apply inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F294A] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/30 sm:text-sm;
  }

  .action-secondary-detail {
    @apply inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/20 sm:text-sm;
  }
}
```

- [ ] **Step 4: Run the focused test and TypeScript check**

Run: `npx vitest run tests/unit/panel-system.test.ts && npx tsc --noEmit`

Expected: PASS with 2 tests and zero type errors.

- [ ] **Step 5: Commit the foundation**

```bash
git add src/app/globals.css tests/unit/panel-system.test.ts
git commit -m "style(ui): add semantic panel and action variants"
```

---

### Task 2: Public discovery pages and Citation spacing

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/category/[slug]/page.tsx`
- Modify: `src/components/citation-modal.tsx`
- Modify: `tests/unit/home-page-query.test.ts`
- Modify: `tests/unit/category-page.test.ts`
- Create: `tests/unit/citation-panel-spacing.test.ts`

**Interfaces:**
- Consumes the public-panel, card-action-row, and 36px action classes from Task 1.
- Keeps `CitationModal` props unchanged: `item`, `triggerVariant`, and `className`.

- [ ] **Step 1: Write failing public-card spacing tests**

Create `tests/unit/citation-panel-spacing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');

describe('citation action spacing', () => {
  it.each(['src/app/page.tsx', 'src/app/category/[slug]/page.tsx'])(
    'uses separated card action rows in %s',
    (file) => {
      const content = read(file);
      expect(content).toContain('action-row-card');
      expect(content).toContain('action-primary-card');
    },
  );

  it('uses an accessible eight-pixel icon gap for citation triggers', () => {
    const content = read('src/components/citation-modal.tsx');
    expect(content).toContain('aria-hidden="true"');
    expect(content).toContain('gap-2');
  });
});
```

Add assertions to the existing homepage and category tests that the public cards include `panel-public`.

- [ ] **Step 2: Run the three public-page tests and verify RED**

Run: `npx vitest run tests/unit/citation-panel-spacing.test.ts tests/unit/home-page-query.test.ts tests/unit/category-page.test.ts`

Expected: FAIL because public cards and citation rows still use divergent inline classes.

- [ ] **Step 3: Migrate homepage and category cards**

In both pages:

- Replace primary public card surface classes with `panel-public` plus only layout-specific utilities such as `flex`, `overflow-hidden`, or `group`.
- Replace citation/source/detail footer wrappers with `action-row-card`.
- Pass `className="action-primary-card"` to `CitationModal`.
- Apply `action-secondary-card` to sibling source/detail links.
- Remove replaced padding, radius, border, shadow, height, and icon-gap utilities from those elements.
- Preserve category-specific semantic colors on `HONOR_ROLL` and empty-state borders.

In `CitationModal`, set visible-label Quote icons to:

```tsx
<Quote aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300" />
```

Use `gap-2` in both trigger variants.

- [ ] **Step 4: Run public-page tests**

Run: `npx vitest run tests/unit/citation-panel-spacing.test.ts tests/unit/home-page-query.test.ts tests/unit/category-page.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit public-page consistency**

```bash
git add src/app/page.tsx src/app/category/[slug]/page.tsx src/components/citation-modal.tsx tests/unit/home-page-query.test.ts tests/unit/category-page.test.ts tests/unit/citation-panel-spacing.test.ts
git commit -m "style(public): align cards and citation action rows"
```

---

### Task 3: Detail pages and profile panels

**Files:**
- Modify: `src/app/showcase/[slug]/page.tsx`
- Modify: `src/app/showcase/[slug]/loading.tsx`
- Modify: `src/app/members/[id]/page.tsx`
- Modify: `src/app/members/[id]/loading.tsx`
- Modify: `tests/unit/showcase-detail.test.ts`
- Modify: `tests/unit/members-page.test.ts`

**Interfaces:**
- Consumes `.panel-detail`, `.panel-nested`, `.action-row-detail`, `.action-primary-detail`, and `.action-secondary-detail` from Task 1.
- Does not change route params, Prisma selection, permission checks, or server/client boundaries.

- [ ] **Step 1: Add failing detail-page contract assertions**

In `showcase-detail.test.ts`, assert that the detail source includes `panel-detail`, `panel-nested`, `action-row-detail`, `action-primary-detail`, and `action-secondary-detail`.

In `members-page.test.ts`, assert that `src/app/members/[id]/page.tsx` and its loading state both include `panel-detail` and `panel-nested`.

- [ ] **Step 2: Run detail tests and verify RED**

Run: `npx vitest run tests/unit/showcase-detail.test.ts tests/unit/members-page.test.ts`

Expected: FAIL on the new semantic-class assertions.

- [ ] **Step 3: Migrate showcase detail**

- Apply `panel-detail` to the main header and long-form content sections.
- Apply `panel-nested` to the abstract, contributor, attachment, and related metadata rows.
- Replace the CTA wrapper after the abstract with `action-row-detail`.
- Use `action-primary-detail` for Citation and `action-secondary-detail` for GitHub, live demo, paper, and external links.
- Keep amber review/rejection callouts semantic by combining their color utilities with `panel-callout`.
- Add `aria-hidden="true"` to decorative action icons beside visible text.

- [ ] **Step 4: Migrate member profile and matching skeletons**

- Apply `panel-detail` to the profile header.
- Apply `panel-nested` to the statistics band and project/contribution rows.
- Use `action-secondary-detail` for profile external links.
- Update loading skeleton shells to the same `rounded-xl` detail geometry and padding so loading-to-content transitions do not shift panel bounds.

- [ ] **Step 5: Run detail tests and TypeScript**

Run: `npx vitest run tests/unit/showcase-detail.test.ts tests/unit/members-page.test.ts && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit detail consistency**

```bash
git add src/app/showcase/[slug]/page.tsx src/app/showcase/[slug]/loading.tsx src/app/members/[id]/page.tsx src/app/members/[id]/loading.tsx tests/unit/showcase-detail.test.ts tests/unit/members-page.test.ts
git commit -m "style(detail): standardize content and profile panels"
```

---

### Task 4: Dashboard and administration panels

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/loading.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/loading.tsx`
- Modify: `src/app/admin/reviews/page.tsx`
- Modify: `src/app/admin/members/page.tsx`
- Modify: `src/components/admin-member-table.tsx`
- Modify: `tests/unit/admin-reviews.test.ts`
- Create: `tests/unit/operational-panels.test.ts`

**Interfaces:**
- Consumes `.panel-operational`, `.panel-nested`, `.panel-callout`, and 36/40px action classes.
- Preserves existing admin actions, table structure, status colors, and authorization.

- [ ] **Step 1: Write failing operational-page tests**

Create `tests/unit/operational-panels.test.ts` that reads each operational page and asserts `panel-operational` is present. Assert dashboard/admin loading states use the same `rounded-lg` shell geometry as their resolved panels. Extend `admin-reviews.test.ts` to require `action-row-card` on review cards.

- [ ] **Step 2: Run operational tests and verify RED**

Run: `npx vitest run tests/unit/operational-panels.test.ts tests/unit/admin-reviews.test.ts`

Expected: FAIL on missing operational variants.

- [ ] **Step 3: Migrate dashboard cards and alerts**

- Apply `panel-operational` to the main work queue and item cards.
- Apply `panel-callout` to amber and rose status messages while retaining semantic color utilities.
- Apply `action-row-card` to item action groups and 36px card action variants to sibling controls.
- Update dashboard skeleton panel bounds to match.

- [ ] **Step 4: Migrate admin overview, reviews, and members**

- Apply `panel-operational` to overview cards, review cards, member-management surfaces, and table containers.
- Preserve the dark navy admin hero as a specialized panel, but align its `rounded-lg` geometry and 24/32px spacing.
- Use `panel-nested` for secondary statistics and table subpanels.
- Normalize controls within each action row to one height; use the card variants for review/member row actions and detail variants for page-level actions.
- Update admin skeleton shells to match resolved panels.

- [ ] **Step 5: Run operational tests and TypeScript**

Run: `npx vitest run tests/unit/operational-panels.test.ts tests/unit/admin-reviews.test.ts tests/unit/admin-member-table.test.ts --passWithNoTests && npx tsc --noEmit`

Expected: PASS; `--passWithNoTests` permits the command when the repository has no dedicated admin-member-table test file.

- [ ] **Step 6: Commit operational consistency**

```bash
git add src/app/dashboard src/app/admin src/components/admin-member-table.tsx tests/unit/operational-panels.test.ts tests/unit/admin-reviews.test.ts
git commit -m "style(operations): align dashboard and admin panels"
```

---

### Task 5: Forms, authentication, contact, and modal shells

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/login/login-form.tsx`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/components/contact-form.tsx`
- Modify: `src/app/account/change-password/page.tsx`
- Modify: `src/components/change-password-form.tsx`
- Modify: `src/app/dashboard/items/new/page.tsx`
- Modify: `src/app/dashboard/items/[id]/edit/page.tsx`
- Modify: `src/components/item-form.tsx`
- Modify: `src/components/ui/modal.tsx`
- Modify: `src/components/citation-modal.tsx`
- Modify: `src/components/admin-create-member-modal.tsx`
- Modify: `src/components/admin-delete-member-modal.tsx`
- Create: `tests/unit/form-panel-consistency.test.ts`

**Interfaces:**
- Consumes `.panel-detail`, `.panel-operational`, `.panel-nested`, `.action-row-detail`, and detail action variants.
- Keeps every form action signature and Modal props unchanged.

- [ ] **Step 1: Write failing form and modal layout tests**

Create `tests/unit/form-panel-consistency.test.ts` to assert:

- login, contact, and change-password shells use `panel-detail` or `panel-operational` consistently;
- `item-form.tsx` uses `panel-operational` for each major field group;
- modal header/body/footer expose `modal-header`, `modal-body`, and `modal-footer` classes;
- citation and admin modals use the shared footer action classes.

- [ ] **Step 2: Run form tests and verify RED**

Run: `npx vitest run tests/unit/form-panel-consistency.test.ts tests/unit/login-page.test.ts tests/unit/contact-page.test.ts tests/unit/item-form.test.ts`

Expected: FAIL on missing semantic form/modal classes.

- [ ] **Step 3: Add modal region classes**

Add to the Task 1 component layer in `globals.css`:

```css
.modal-header {
  @apply flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-5;
}

.modal-body {
  @apply px-5 py-5 sm:px-6 sm:py-6;
}

.modal-footer {
  @apply mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5;
}
```

Apply them in `ui/modal.tsx` and all modal content footers. Remove duplicate local padding and footer-divider utilities.

- [ ] **Step 4: Migrate form page families**

- Use `panel-detail` for public-facing login/contact/account shells.
- Use `panel-operational` for dashboard item form groups.
- Use `panel-nested` for subordinate instructions, previews, and helper panels.
- Use `action-row-detail` for final form action groups and match submit/cancel controls to the detail action variants.
- Preserve validation, upload state, server actions, and form field styling.

- [ ] **Step 5: Align citation and admin modal actions**

- Apply `modal-footer` to their footer wrappers.
- Use `action-primary-detail` for copy/confirm actions and `action-secondary-detail` for close/cancel/download actions.
- Ensure all visible-label icons use `aria-hidden="true"`.

- [ ] **Step 6: Run form tests and TypeScript**

Run: `npx vitest run tests/unit/form-panel-consistency.test.ts tests/unit/login-page.test.ts tests/unit/contact-page.test.ts tests/unit/item-form.test.ts && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit form and modal consistency**

```bash
git add src/app/globals.css src/app/login src/app/contact src/app/account src/app/dashboard/items src/components/contact-form.tsx src/components/change-password-form.tsx src/components/item-form.tsx src/components/ui/modal.tsx src/components/citation-modal.tsx src/components/admin-create-member-modal.tsx src/components/admin-delete-member-modal.tsx tests/unit/form-panel-consistency.test.ts
git commit -m "style(forms): standardize shells and modal actions"
```

---

### Task 6: Remaining shared panels, accessibility audit, and full verification

**Files:**
- Modify: `src/app/members/page.tsx`
- Modify: `src/app/loading.tsx`
- Modify: `src/components/ui/empty-state.tsx`
- Modify: any remaining `src/app/**/*.tsx` or `src/components/**/*.tsx` file identified by the audit command below
- Modify: relevant existing unit tests when a migrated surface already has coverage

**Interfaces:**
- Consumes all semantic classes from Task 1 and Task 5.
- Produces no new public interface; this task closes remaining inconsistencies and verifies the complete system.

- [ ] **Step 1: Audit remaining divergent panel and action patterns**

Run:

```bash
rg -n "rounded-(md|lg|xl|2xl).*border|border.*rounded-(md|lg|xl|2xl)|h-(8|9|10|11).*inline-flex" src/app src/components -g "*.tsx"
```

Classify each result as semantic panel/action migration, compact metadata, input control, navigation, or intentionally specialized surface. Record intentional exceptions as short JSX comments only where the reason would otherwise be unclear.

- [ ] **Step 2: Migrate remaining content surfaces**

- Apply `panel-public` to member directory cards and the matching global loading cards.
- Apply the relevant semantic class to any remaining content panel found in Step 1.
- Keep navigation, badges, inputs, thumbnails, and compact metadata controls outside the panel system.
- Update `EmptyState` to inherit its caller's geometry through `className`, defaulting to `rounded-xl` for public pages.

- [ ] **Step 3: Complete the accessibility pass**

For each action icon adjacent to visible text in touched files, add `aria-hidden="true"`. Verify keyboard focus utilities remain on primary and secondary action variants. Confirm wrapping action rows use `flex-wrap` and `gap-3` at 375px.

- [ ] **Step 4: Run the complete unit suite**

Run: `npm run test:unit`

Expected: all unit tests pass with zero failures.

- [ ] **Step 5: Run static validation**

Run: `npx tsc --noEmit && git diff --check`

Expected: both commands exit 0.

- [ ] **Step 6: Run the production build**

Run: `npm run build`

Expected: Next.js reports `Compiled successfully`, completes page generation, and exits 0.

- [ ] **Step 7: Review responsive page families**

At 375px and desktop width, inspect `/`, `/category/robotics-iot`, one `/showcase/[slug]`, `/members`, one `/members/[id]`, `/dashboard`, `/admin`, `/login`, and `/contact`. Confirm no body text touches action rows, sibling buttons match height, panels within each page share radius/padding, and wrapped actions do not overlap.

- [ ] **Step 8: Commit the final audit**

```bash
git add src/app src/components tests/unit
git commit -m "style(ui): complete sitewide panel consistency audit"
```
