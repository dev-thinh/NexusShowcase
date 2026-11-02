# Main branch promotion policy

The user requires development pushes on dev, promotion through a dev -> main pull request, and production deployment only after CI passes on the main merge commit. A feature branch or fork branch named dev must not qualify.

## Approach

Use a named metadata-only PR check plus an active GitHub branch ruleset targeting main. A workflow alone cannot prevent pushes or merges; repository rules must require PRs and successful source-policy and existing CI checks, with no bypass actors. The metadata-only pull_request_target check uses the trusted default-branch workflow and accepts only dev from the same repository into main, and reruns when the PR is edited or synchronized. It does not check out PR code or receive deployment secrets.

Keep the existing CI tests. CD remains the selected GitHub-hosted Actions + private Tailscale architecture; deployment transport and production release switching are a separate implementation step. Never push main from this task, merge automatically, or modify unrelated UI work.

A repository administrator can edit the rules or workflow, so enforcement assumes repository settings and workflow changes remain under trusted maintenance. Native branch protection does not itself filter PR source branches; the custom required check supplies that rule.
