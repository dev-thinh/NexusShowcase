# Sitewide Panel Consistency Design

## Goal

Standardize panels, cards, action rows, and their buttons across NexusShowcase while preserving a distinct, internally consistent density for each page family. The overall density is balanced: readable and comfortably spaced without making administrative pages inefficient.

## Scope

This change covers all application routes and shared components under `src/app` and `src/components`, including their loading and empty states. It focuses on panel geometry, surface treatment, internal spacing, action-row separation, and button alignment. It does not redesign information architecture, typography, colors, navigation behavior, or data flows.

## Architecture

Use a hybrid styling system:

1. Define a small set of reusable panel, action-row, and action-button variants as the shared source of truth.
2. Apply those variants consistently within each page family.
3. Keep semantic color differences and specialized layouts local to their page or component.

This avoids a single rigid `Panel` abstraction while preventing long, divergent Tailwind class strings from becoming the styling contract.

## Shared Visual Rules

### Spacing rhythm

- Use the existing 4px-based Tailwind scale with primary gaps of 8, 12, 16, and 24px.
- Separate content from an action row with both visual space and structure: a top margin, top padding, and a subtle divider where appropriate.
- Keep icon-to-label gaps at 8px for standard actions and 6px only for compact metadata controls.
- Avoid action buttons touching body copy, summaries, or citation text.

### Surface hierarchy

- Primary public-content panels use `rounded-xl`, a slate border, white background, and a restrained shadow.
- Dashboard and admin panels use `rounded-lg` with denser padding and the same border hierarchy.
- Nested panels and semantic callouts use `rounded-lg`, tinted backgrounds, and 12–16px padding.
- Empty and loading states inherit the geometry of the panel they replace.

### Actions

- Buttons in one action row share height, radius, font size, icon size, and vertical alignment.
- Public listing-card actions use a 36px height.
- Detail-page and primary-form actions use a 40px height.
- Primary actions retain navy styling; secondary actions use white or slate surfaces.
- Decorative icons beside visible button labels are hidden from the accessibility tree.

## Page Families

### Homepage and category directory

- Content cards: `rounded-xl`, 20px mobile padding, 24px larger-screen padding.
- Card action rows: 16px separation from body content, subtle top divider, 16px top padding.
- Cite, source, and detail actions: consistent 36px height and 8px icon-label gap.
- Grid cards use matching header/body/footer rhythm even when thumbnails differ.

### Showcase and member detail pages

- Primary panels: `rounded-xl`, 24px mobile padding, up to 32px larger-screen padding.
- Nested summaries, contributor rows, and metadata panels: `rounded-lg`.
- CTA rows: 20–24px separation from preceding content; all buttons use 40px height.

### Dashboard and administration

- Main panels: `rounded-lg`, 16–24px padding.
- Cards in the same grid share internal header/body/footer structure and visual height where content permits.
- Dense table controls may remain compact, but controls in the same row must match.

### Login, contact, account, and item forms

- Form shells: `rounded-xl` with consistent header, field-group, and footer spacing.
- Form footers use a divider and a clear gap from the final input group.
- Footer buttons share height and alignment.

### Modals

- Modal shell, header, body, and footer use a consistent padding system.
- Footer actions are separated from body content and aligned to a shared height.
- Citation tabs and preview remain functionally unchanged; only spacing and action alignment change.

## Citation-Specific Fix

The Cite trigger must no longer appear attached to summary text. Every citation trigger used in a card participates in the card action row, which has 16px separation and a divider. The Quote icon and label use an 8px gap. Citation actions match sibling controls in height and radius on each page family.

## Accessibility and Responsive Behavior

- Preserve keyboard focus styles and semantic button/link elements.
- Mark decorative icons with `aria-hidden="true"` when adjacent visible text already provides the label.
- Allow action rows to wrap on narrow screens with a 12px gap; controls must not overlap or truncate essential labels.
- Verify at 375px and desktop widths.

## Testing and Verification

- Add tests for the shared style variants or primitives introduced by implementation.
- Add a regression test for citation action-row spacing and matched control dimensions.
- Run the complete unit-test suite.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Inspect the key page families at mobile and desktop widths if a browser runtime is available.

## Non-Goals

- No changes to database queries, authorization, content, routes, or navigation.
- No new animation system or color palette.
- No wholesale component rewrite where shared variants can solve the inconsistency.
