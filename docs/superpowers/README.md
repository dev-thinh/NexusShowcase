# Current contracts and historical documents

The approved [2026-10-21 refactor specification](specs/2026-10-21-repository-refactor-design.md) and [roadmap](plans/2026-10-21-repository-refactor.md) define current behavior. Implementation walkthroughs and verification reports live in `reports/`.

Earlier specs/plans remain historical records. In particular, the 2026-10-10 system design and later editorial plans describing an EDITOR approval stage or ten pinned posts are superseded: current review is direct Admin approval, at most three pinned publications, immutable submitted revisions and expected-review-version concurrency. Persisted legacy editorial history/enums remain supported. Do not reintroduce old UI/workflow behavior from historical documents.

Current architecture: [module ownership](../architecture.md). Database setup/rollout: [operations](../database-operations.md). Current visual behavior is the computed-style baseline recorded by P3, not an instruction to redesign from an older plan.
