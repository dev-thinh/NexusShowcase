# Audit Remediation Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement independently reviewed tasks; preserve the existing uncommitted work.

**Goal:** Resolve the remaining audit findings without deleting existing media or rewriting existing accounts silently.

**Architecture:** Keep request authorization server-side and use the existing PostgreSQL database for shared state. Asset access follows publication visibility and ownership; original cloud objects must not bypass the gateway. Schema changes are additive migrations and tested in isolated schemas before any runtime rollout.

**Tech Stack:** Next.js, React, Prisma/PostgreSQL, Zod, ImageKit, Vitest/Playwright.

**Spec:** `docs/repository-audit-2026-10-24.md`, accepted by the user on 2026-10-25.

## Global Constraints
- Preserve approved homepage loading, animation and route-scroll behavior.
- No destructive DB resets, account merges, mass cloud deletion, or irreversible cache operations.
- Test database identity must differ from runtime database identity.
- PRIVATE published content follows the current authenticated-reader policy; unpublished content follows creator/reviewer access.
- An asset used publicly remains public even if another private document references it.
- Cleanup defaults to inventory/dry-run and refuses incomplete reference provenance.

## Review Focus
- Existing identifier collisions must be detected without printing account identifiers.
- Concurrent password changes and throttling must use atomic database operations.
- Protected attachments must never be cached publicly or served through a bypass URL.
- Gallery/avatar/live/draft/revision/editorial references all protect assets from orphan cleanup.
- Dependency upgrades must preserve validation behavior, Prisma generation and migration tooling.

## Tasks
- [x] Upgrade vulnerable validation dependency and test a compatible fix for Prisma's transitive advisory; review npm audit after changes.
- [x] Normalize account lookup and creation, prepare guarded uniqueness migration, prevent password-change races, add shared login/upload throttling.
- [x] Add asset registry preserving provider fileId; implement authenticated document/resource delivery and private cloud-object support with safe legacy reconciliation.
- [x] Add complete-reference, grace-period orphan inventory and explicitly applied cleanup; retain unknown legacy assets.
- [x] Release finished PageReveal animation references without replaying settled entries.
- [x] Run unit/type/architecture checks, isolated DB migration/integration checks, production build and relevant browser scenarios; update the audit report with outcomes and any rollout prerequisites.
