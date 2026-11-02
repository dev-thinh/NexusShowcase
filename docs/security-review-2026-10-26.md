# Security review — 2026-10-26

## Scope and conclusion

Reviewed application source, route handlers, Server Actions, session validation, public data selection, submission/review authorization, file storage/delivery, browser policy and installed dependencies. Independent reviewers examined identity, assets and content; another pass reviewed the combined patch. This is source review plus automated regression testing, not a certification or a penetration test of a deployed system.

Public member IDs in URLs are not credentials. Public profile queries select an explicit public DTO; profile and avatar mutations derive the target from the authenticated actor. Changing an identifier must never substitute for authorization. No identity/profile IDOR was confirmed in the reviewed paths.

## Confirmed findings and fixes

| Finding | Preconditions and impact | Remediation and regression evidence |
| --- | --- | --- |
| Private asset reference laundering — high | A user with posting privileges knows another person's private managed-file URL. A new draft reference previously granted its creator read access. | `assets/server/reference-access.ts` checks existing access before draft creation/update. `assets/server/access.ts` no longer trusts an owner-created draft/history reference to a foreign or ownerless registered asset, including references persisted before this fix. Unit and database tests cover thumbnail, resource, text, encoded text, historical references and preexisting malicious references, plus legitimate owner/public/legacy reuse. |
| Incomplete custom API CSRF checks — medium | Upload API omitted Origin validation; galleries accepted missing origins, compared host without scheme, and accepted JSON supplied as a simple content type. SameSite cookies alone are insufficient for all same-site attack scenarios. | `server/http/mutation-request.ts` requires an exact HTTP(S) origin, pins AUTH_URL/NEXTAUTH_URL when configured, rejects cross-site Fetch Metadata, and requires JSON for gallery mutations. Checks precede parsing/writes. Unit and browser tests cover authenticated missing/foreign/null origins and protocol mismatches. Auth.js and Next Server Actions retain their own protections. |
| Gallery body buffering before size validation — medium | An authenticated caller sends an oversized/chunked gallery request. Previous code buffered the entire body before checking its length. | A shared streaming JSON reader limits actual bytes to 64,000 and cancels the stream immediately on overflow, returning 413. Tests verify cancellation and no mutation. Reverse-proxy timeouts/limits are still needed for connection-level abuse. |
| Upload action throttle bypass — medium | A signed-in caller invokes upload Server Actions rather than `/api/upload`, avoiding its route-only limiter. | File and avatar actions consume one shared per-account upload budget before storage. The API retains a separate pre-parse budget. Regression tests ensure denied calls do not reach the upload command. |
| Password-change guessing outside login throttle — medium | An attacker with a valid session repeatedly guesses the current password through the change-password action. | Password changes use a database-backed actor-specific budget before password comparison. Tests assert bcrypt and writes are skipped when denied. |
| Weak new-password policy and bcrypt truncation — medium/low | New passwords previously allowed six characters and up to 128 characters even though bcrypt considers only the first 72 UTF-8 bytes. | The user-approved password-change policy is at least 8 characters including an uppercase letter, a digit and a special character, and at most 72 UTF-8 bytes. Admin-entered initial credentials retain their existing 15-character policy and optional random generation, per the request to defer changes to account provisioning. UI and runtime schemas agree. Existing login/current-password verification remains compatible. Tests cover composition, short passwords, ASCII and multibyte byte boundaries, and concurrent credential updates. |
| Institutional alias throttle splitting — low | The short login name and institutional email aliases resolve to the same account but previously obtained separate budgets. | Institutional aliases share a canonical throttle key. Other email addresses, including test identities, retain their existing keys. |
| Production CSP unnecessarily allowed eval — defense in depth | An additional policy weakness, not an independently demonstrated XSS exploit. | `unsafe-eval` is allowed only in development, where Next.js requires it. Production build/browser checks verify the application remains functional. |

The ACL preserves explicit admin/editor review privileges and access to actually published internal/public placements. It does not equate merely knowing a file URL with authorization.

## Other safeguards examined

- Submission edits, submission and withdrawal require the creator; review decisions require a current administrator.
- Review/version transitions use transactions and version guards.
- JWT validation refreshes account status/role and rejects stale session versions; password/role/account changes invalidate sessions.
- Public DTOs omit password hashes, email addresses, student IDs and session versions.
- Article text is rendered through React text nodes. Video hosts/identifiers and saved profile/link protocols are constrained.
- Managed file paths are allowlisted, file sizes/signatures are validated where applicable, arbitrary resources are delivered as attachments outside the static public directory, and file delivery checks access.
- Personalized home data uses private/no-store responses.
- No environment secret/key files were found among tracked file paths. This is not a forensic scan of all Git history or a substitute for secret rotation.

## Verification

- Regression tests were observed failing before implementing the corresponding fixes.
- Type checks, unused checks and architecture checks passed. The complete unit suite passed with 133 files and 657 tests using `vitest run tests/unit --maxWorkers=1`. A parallel local run hit resource-related timeouts in the source-scan and upload tests; both passed with unchanged timeouts in the serial run.
- Complete database integration suite: passed; 22 files, 84 tests, in disposable schemas in the verified dedicated test database.
- Complete production browser suite: 60 tests passed before the subsequent form/selection refinements. The latest production build and all 4 targeted browser tests passed for credential lifecycle, text selection, complete validation messages and independent password visibility controls. Earlier focused checks also verified mouse/touch photo dragging after waiting for the dialog entrance animation.
- `npm run db:verify-upgrade`: fresh and legacy schema verification passed.
- `npm audit --json`: 0 known advisories for the installed dependency graph at review time. This is not proof of absence of unknown vulnerabilities.
- Independent patch review: no Critical/Important blockers reported, including a final review of the read-side ACL and password-policy follow-ups.

## Runtime inventory and remaining boundaries

A read-only inventory of the database configured in this workspace found 8 referenced asset URLs, 8 registered assets, 0 unregistered referenced assets and 8 registrations without ownership metadata; no reference sources failed inspection. No runtime records or files were modified. Ownerless registrations cannot be unlocked by a caller's own draft under the patched ACL; genuine public/published placement and privileged access still apply. This inventory does not establish the state of another production database.

Legacy unregistered files elsewhere retain existing creator-reference compatibility because historical ownership cannot be inferred safely. Reconcile their provenance with `npm run assets:inventory`; do not invent owners or automatically delete data. Previously public files may already have been copied, and cannot be made confidential retroactively.

Before describing a deployment as protected, verify HTTPS, trusted proxy/Host handling, a correct public AUTH_URL/NEXTAUTH_URL, strong independent AUTH_SECRET, database/network privileges, non-public private storage/CDN origin settings, connection/body limits, disk/storage quotas, backups and restore, logs/alerts, and dependency update procedures. Infrastructure and live CDN origin access were not changed or penetration-tested in this task. Per-account throttles do not provide edge protection against distributed traffic or substitute for storage quotas.

The CSP still permits inline scripts for the current Next.js rendering setup. A nonce-based strict CSP and MFA are further hardening projects; no demonstrated XSS exploit or MFA bypass was found. The current review cannot guarantee protection against every present or future vulnerability.

## References

- [OWASP IDOR prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP password storage and bcrypt input limits](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- Installed Next.js guides: `node_modules/next/dist/docs/01-app/02-guides/data-security.md` and `content-security-policy.md`.
