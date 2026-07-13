# QuorumRouter v0.1.15

QuorumRouter v0.1.15 publishes the deterministic offline hierarchical
calibration demo and hardens the release tarball gate with one shared allowlist.

## Added

- `deno task calibration:hierarchy-demo` in newly generated workspaces.
- Three local fixture scenarios covering direct prompt-pattern selection,
  fallback to task subtype, and fallback to task type.
- A foreign-source fixture proving that another exact provider/model identity
  does not contribute to the queried source counts.
- Machine-readable candidate counts, sample statuses, selected scope, threshold,
  and explicit advisory/no-provider boundaries.

## Release hardening

- Replaced duplicate tarball allowlists in the Deno tests and publish workflow
  with `packages/create-quorum-router/tarball-files.json` as the single source
  of truth.
- Added tests requiring both the workflow and tarball verification to consume
  the shared manifest.
- Preserved exact tarball-content and source-file-mode checks.

## Safety and compatibility

- The demo runs without Deno permissions and makes no provider or network calls.
- Calibration remains advisory-only and does not change routing, provider
  eligibility, ranks, weights, quorum, budget, or execution.
- Labels remain caller-defined canonical categories, not raw prompts.
- Existing flat calibration and v0.1.13 hierarchical APIs remain compatible.

## v0.1.14 status

The immutable v0.1.14 tag remains as release history. Its npm publish stopped at
the pre-publication tarball verification gate, so `create-quorum-router@0.1.14`
was never published. v0.1.15 supersedes it.

## Verification

- Full Deno unit and integration suite
- Typecheck, lint, format, and frozen-lock verification
- Exact npm tarball manifest and source mode verification
- Secret scans before push and publication
- Fresh NPX-generated scaffold and hierarchy-demo execution after publication

## Migration

No migration is required. Generate a new workspace or update an existing
workspace to use `deno task calibration:hierarchy-demo`.
