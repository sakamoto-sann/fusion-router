# QuorumRouter v0.1.10

QuorumRouter v0.1.10 is a post-launch production-gate release. It removes stale
product-stage language, connects task calibration to real routing paths without
granting it authority, and makes external execution/provider readiness claims
verifiable.

## Calibration routing integration

- Direct `routeWithDecisionReport` accepts strict caller-attested calibration
  evidence and aggregates it before provider invocation.
- Invalid or duplicate evidence fails before any provider adapter is called.
- The advisory report is attached to direct-routing success and failure Decision
  Reports.
- Calibration does not alter candidate eligibility, rank, quorum, budget,
  fallback, or execution authority.
- Generated `route:once` and `best-route` accept
  `--calibration-evidence <local-json>` before provider discovery/invocation.
- Generated persistent traces store metrics with SHA-256 task/source
  identifiers; raw task, provider, and model labels are not persisted.
- Aggregation is synchronous but bounded to 10,000 observations before the route
  timeout starts.

## SafeLoop production gate

- CI checks out the exact compatible SafeLoop source commit
  `7fd558459610dbc5c6f1a467a30e0a939410308d`.
- `SAFELOOP_E2E_REQUIRED=1` now fails if the explicit SafeLoop binary is
  missing.
- CI executes the real approved-write, reviewer-objection, approved-fix, and
  verified-closeout E2E instead of silently returning when the environment is
  absent.

## Provider readiness honesty

Command presence is discovery, not proof of live authentication.

The release was dogfooded with this environment-specific matrix:

- OpenAI Codex OAuth/session: live invocation passed.
- xAI Grok session: live invocation passed.
- Cognition Devin session: live invocation passed.
- Anthropic Claude Code: blocked by organization policy disabling subscription
  access.
- Google Gemini: OAuth mode selected, but browser consent/re-authentication was
  still required.
- Alibaba Qwen: removed from automatic session candidates because the installed
  CLI required `OPENAI_API_KEY` while the wrapper intentionally clears secret
  environment values. Users can still configure an explicit generic private env
  fallback.

`health`, `intake`, and `auth:status` now say when a command is merely
discovered and explicitly report that no live provider authentication was
verified by those non-invoking checks.

## Public surface cleanup

- Removed the stale GitHub repository description that called QuorumRouter a
  development-stage router.
- Replaced obsolete launch-day/dogfood packs with current release documentation.
- Removed stale version pointers and old product-stage wording from current
  docs, examples, generated templates, and output.
- Renamed the canonical Agent Chat opt-in to `RUN_AGENT_CHAT=1`; the old
  variable remains accepted only for compatibility.
- Conversation-only Agent Chat is labeled as a no-mutation mode. SafeLoop-backed
  execution remains a separate explicit-authority path.

## Verification requirements

- formatting, lint, type checks, tests, and smoke
- required real SafeLoop execution E2E
- clean NPX generation plus `check`, `smoke`, and calibration route exercise
- whole-tree and exact outgoing-diff secret scans
- dead-reference and stale product-stage scans
- independent whole-diff P0/P1/P2 Red Team
- npm/GitHub/tag/provenance readback after publication
