# QuorumRouter v0.1.12

QuorumRouter v0.1.12 corrects the Hermes health contract so command discovery is
never presented as proof of live provider authentication.

## Changed

- Adds explicit command-boundary fields:
  - `command_discovered`
  - `command_executable`
  - `command_discovered_count`
  - `command_executable_count`
- Retains the legacy `available`, `can_invoke`, `available_count`, and
  `invokable_count` fields for compatibility, but sets them to fail-closed
  `false`/`0` and marks them `deprecated_fail_closed`.
- Adds `live_auth_status: "not_checked"` for every provider returned by the
  no-generation health operation.
- Adds `live_verified_count: 0` and an explicit note that only a live route can
  verify authentication.
- Keeps route-time provider selection behavior unchanged.
- Removes the stale Qwen executable from the Hermes plugin's Deno `--allow-run`
  collection.
- Updates the Hermes plugin metadata to v0.4.0 and removes wording that implied
  discovery alone meant verification.

## Why

A locally installed CLI can still be blocked by an expired session, missing
OAuth consent, or organization policy. Health intentionally sends no model call,
so it can establish command presence but cannot establish live authentication.
This release makes that boundary machine-readable and fail-closed for consumers.

## Verification

- Deno unit and integration tests
- Hermes plugin Python tests
- Full repository checks and formatting
- Generated package smoke test
- Exact outgoing secret scan before push
