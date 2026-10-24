# Final patched-runtime navigation measurements

Raw samples: [final](refactor-final/metrics.json), [baseline](refactor-baseline/metrics.json). The Node/OS/CPU-count/browser/viewport/production fingerprint and metric definitions match exactly. Software intentionally differs: final Next15.5.28/React19.3.1/PostCSS8.5.31 includes compatible patches applied after P3. Earlier matched-software results remain in [P3 report](refactor-performance.md). This is a local comparison, not a production latency guarantee.

| Items | Route | Baseline first-data median / p95 ms | Final first-data median / p95 ms | Final pending median / p95 ms |
| --- | --- | --- | --- | --- |
| 20 | /category/bai-bao-khoa-hoc | 23.3 / 82.2 | 51.1 / 65.5 | 1.6 / 5.6 |
| 20 | /category/robotics-iot | 22.1 / 35.0 | 36.1 / 43.5 | 1.6 / 4.6 |
| 20 | /members | 20.7 / 33.7 | 24.6 / 40.2 | 1.3 / 2.2 |
| 20 | / | 332.6 / 630.5 | 349.2 / 362.2 | 1.4 / 4.5 |
| 1000 | /category/bai-bao-khoa-hoc | 25.1 / 34.6 | 55.3 / 114.8 | 2.0 / 8.4 |
| 1000 | /category/robotics-iot | 23.4 / 35.3 | 40.2 / 72.7 | 1.5 / 4.8 |
| 1000 | /members | 19.2 / 25.1 | 39.8 / 96.0 | 1.4 / 3.2 |
| 1000 | / | 627.1 / 633.9 | 347.8 / 379.5 | 1.4 / 4.5 |

Both datasets have ten warm samples per route and one separate cold-browser sample per route:88 total, with no discarded samples or selective reruns. Raw artifacts retain cold shell/data timings and available auth/SQL/RSC values. First-data means the expected fixture heading became visible, not that all page data settled. Cold browser contexts may use a warm server/database. SQL/auth values cover observation windows including prefetch/background activity; request-level attribution is unavailable. RSC bytes are decoded response bodies, not compressed transfers. Missing values remain null.

Ten warm observations are insufficient to attribute small tail differences to a code change. All medians and p95 values, including increases, are reported above; the browser gate separately verifies feedback below200ms while delaying the response.

Observed changes (final minus baseline, ms):

| Items | Route | Median delta | p95 delta |
| --- | --- | --- | --- |
| 20 | /category/bai-bao-khoa-hoc | 27.9 | -16.7 |
| 20 | /category/robotics-iot | 14 | 8.5 |
| 20 | /members | 3.9 | 6.5 |
| 20 | / | 16.6 | -268.3 |
| 1000 | /category/bai-bao-khoa-hoc | 30.2 | 80.2 |
| 1000 | /category/robotics-iot | 16.9 | 37.4 |
| 1000 | /members | 20.6 | 70.9 |
| 1000 | / | -279.3 | -254.4 |

This does not establish a uniform no-regression result: increased cached-route medians remain visible in the table. For example, the20-item research warm samples have null SQL/RSC observations and identical shell/data times, so they do not establish a slower database query. The cause of the cached client timing difference is unproven; neither noise nor the security patches alone can be asserted as its cause. No speculative cache/session-policy change or selective benchmark rerun was used to hide it.
