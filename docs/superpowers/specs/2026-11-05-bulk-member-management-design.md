# Bulk member management

Approved in conversation: a template CSV upload previews all accounts and row errors before creating valid rows. Columns are Họ tên, Tên đăng nhập/email (required) and MSSV (optional). There is no role/password input; new users are MEMBER and must change generated temporary passwords. A separate button opens a searchable, paginated multiple-selection modal to grant CORE_MEMBER, matching existing bulk publication modals. No checkboxes are added to the outside member list.

Use existing Modal, FilePicker, SearchForm, identity actions, creation commands and invalidation. Limits: UTF-8 CSV 128 KiB / 100 data rows; 50 promotions per operation. Accept BOM, CRLF, comma/semicolon delimiters and standard quoted cells. Validate missing/unknown headers, field lengths, login syntax and alias-equivalent duplicate identifiers both within the file and against stored accounts (including hidden/disabled accounts). Never overwrite existing identities. Server reparses and revalidates at submission time.

Return per-row creation outcomes; only successful newly created users receive temporary passwords in the response. Offer a formula-safe UTF-8 CSV export of results and credentials, preserve it until downloaded/explicitly discarded. No plaintext credentials are persisted. Reuse existing per-account transactional creation and alias-family uniqueness: partial successes are retained, repeated submissions cannot duplicate users. A lost response is reported as uncertain; no automatic replay/reset of credentials.

Promotion searches active, visible MEMBER users only; search/pagination retain selections. Confirm the selected list before granting. Atomic serializable mutation rechecks administrator authority and target roles, visibility, status, deletion and session versions; any conflict leaves the entire selection unchanged. Never downgrade/admin-promote/reset unrelated accounts.

No migrations, new packages or external messages are needed. Small commits on dev were authorized after implementation. Work directly on dev and preserve earlier uncommitted changes.
