# Navigation performance verification — 2026-10-21

Final patched-runtime measurements are reported separately in [final performance](refactor-final-performance.md), including cached-route timing increases. The matched-software P3 results below remain unchanged.

Raw artifacts: [baseline](refactor-baseline/metrics.json), [after](refactor-after/metrics.json). Both environments match exactly: Node v24.20.0, Windows x64, Edge 155.0.4283.62, viewport1440x1000, production. Each dataset20/1000 has100 members,40 warm samples (10 per route) and4 cold-browser samples. All88 after samples reached visible data; no rerun or discarded samples.

| Items | Route | Before data median / p95 ms | After data median / p95 ms | After pending median / p95 ms |
| --- | --- | --- | --- | --- |
| 20 | /category/bai-bao-khoa-hoc | 23.3 / 82.2 | 23.4 / 57.0 | 0.8 / 6.7 |
| 20 | /category/robotics-iot | 22.1 / 35.0 | 21.8 / 32.8 | 1.0 / 1.5 |
| 20 | /members | 20.7 / 33.7 | 19.7 / 34.5 | 0.7 / 1.2 |
| 20 | / | 332.6 / 630.5 | 336.1 / 347.1 | 0.8 / 2.1 |
| 1000 | /category/bai-bao-khoa-hoc | 25.1 / 34.6 | 21.0 / 48.1 | 0.6 / 9.7 |
| 1000 | /category/robotics-iot | 23.4 / 35.3 | 15.5 / 32.5 | 0.7 / 1.2 |
| 1000 | /members | 19.2 / 25.1 | 16.0 / 23.8 | 0.9 / 1.1 |
| 1000 | / | 627.1 / 633.9 | 335.7 / 344.0 | 0.9 / 1.3 |

Home at1000 items improves median46.5% and p9545.7%. At20 items the home median changes+3.5ms (+1.1%) while p95 decreases283.4ms. Research at1000 has a lower median but p95 increases13.5ms; members at20 has p95+0.8ms. Ten observations per route are too few to infer small tail differences confidently. Report all samples; do not interpret router-cache hits as backend speed.

Warm home SQL-window count median/p95: dataset20 =6/8; dataset1000 =6/6. Most other warm routes use router cache and have no observed server event/body; their values are null, not zero. Home decoded RSC body is observed in only1/10 warm samples:28521 bytes (20) and28482 bytes (1000). Exact request-level SQL count and full-page settled time remain unavailable. No index or cross-request cache was added without query-plan evidence.

Cold-browser observations (one per route/dataset; server/database may already be warm):

| Items | Route | Shell ms | First data ms | Window SQL count | Decoded RSC bytes |
| --- | --- | --- | --- | --- | --- |
| 20 | /category/bai-bao-khoa-hoc | 65.3 | 65.3 | unavailable | unavailable |
| 20 | /category/robotics-iot | 79.5 | 79.5 | unavailable | unavailable |
| 20 | /members | 42.0 | 42.0 | unavailable | unavailable |
| 20 | / | 61.3 | 61.3 | unavailable | unavailable |
| 1000 | /category/bai-bao-khoa-hoc | 62.3 | 62.3 | unavailable | unavailable |
| 1000 | /category/robotics-iot | 43.6 | 43.6 | unavailable | unavailable |
| 1000 | /members | 38.3 | 38.3 | unavailable | unavailable |
| 1000 | / | 47.0 | 47.0 | unavailable | unavailable |

Metrics retain F6's implementation: click-to-data means first expected fixture heading visible, not complete-page/all-data settled. Auth/SQL events are numeric sums inside serial windows and can include prefetch/background work. RSC size is decoded complete response-body bytes, not compressed transfer bytes. Pending feedback is distinct from data latency; delayed-network browser tests prove feedback under200ms.

Computed-style before/after JSON in [presentation](presentation/) matches exactly at390/768/1440 for hero/title/art/navigation/card/dialog/empty/form. Reduced-motion content remains opacity1. Observer regression:20 mutations used to trigger21 full-document scans; after uses1 initial scan and registers only added subtrees. Cleanup cancels animations/disconnects both observers. Unit372/372, focused reveal/IME13/13, production presentation/navigation5/5, typecheck/architecture pass at P3.
