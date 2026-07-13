# QuorumRouter v0.1.2

## Status

Security hardening release after the first AgentRuntime release.

## Summary

v0.1.2 includes post-v0.1.1 security hardening for diagnostics redaction,
AgentChat redaction, process-backed structured synthesis temp files, security
posture documentation, and developer-adoption bootstrap paths.

## What changed since v0.1.1

- Credential redaction hardening:
  - non-standard credential-bearing names
  - authorization / proxy-authorization values
  - URL/query credentials
  - `sk-...`
  - GitHub token-shaped strings
  - JWT-like strings
  - long high-entropy token-like strings
  - reduced over-redaction for normal words such as `monkey=banana`
- AgentChat redaction hardening:
  - keeps chat-specific redaction passes
  - applies opaque credential-shape redaction without duplicating full
    diagnostic sanitizer work
- Process temp file hardening:
  - per-invocation secure temp directory
  - UUID-based schema/output temp paths
  - best-effort restrictive `0600` file permissions
  - cleanup in `finally`
  - OS/filesystem/umask caveats documented
- Security documentation:
  - added `docs/security.md`
  - README links to security status page
  - explicit MIT-licensed open source license posture
  - explicit runtime boundaries and operational caveats
- Developer-adoption bootstrap paths:
  - includes npm create package scaffold and install helper scripts
  - adds README quickstart, install docs, and Product Hunt quickstart notes
  - keeps npm publication status separate from GitHub release publication

## npm scaffold follow-up

This is a historical v0.1.2 release note. At publication time, the npm scaffold
had already advanced to `create-quorum-router@0.1.3` for generated-demo
compatibility. It does not describe the current npm `latest` dist-tag; current
quickstarts use `create-quorum-router@latest`.

## Runtime scope

No routing behavior changes.

- `direct` was the production-ready best-answer routing path in this release.
- `agent_chat` was conversation-only and explicit opt-in.
- AgentRuntime was in-process only in this historical release.

## Not included

- No SafeLoop-backed execution slice in v0.1.2.
- No live Supabase Agent Bus runtime client/writes.
- No Supabase Realtime subscriber.
- No worker process spawning.
- No AgentRuntime external tool execution.
- No service-role runtime.
- No persistent budget database.
- No app-level rate limiting.
- No process sandbox/containerization.
- No SBOM or signed release.

## License

QuorumRouter is MIT.

This is an OSI-approved open source license.

Commercial and production use are permitted under the MIT License.

## Verification target

Release target commit: the final `main` HEAD selected during the v0.1.2 release
readback and recorded by the published `v0.1.2` Git tag.

Expected verification:

- `deno task lock:check`
- `deno task check`
- `deno task lint`
- `deno task test`
- `deno task doctor`
- `deno task smoke:v0.1`
- `cd packages/create-quorum-router && npm pack --dry-run`
- `cd packages/create-quorum-router && npm pkg get name version license bin files`
- `gitleaks git --log-opts "$(git merge-base origin/main HEAD)..HEAD" --redact --no-banner`

Expected results:

- tests: v0.1 baseline plus npm/install/docs bootstrap tests pass
- doctor: `ok: true`
- smoke:v0.1: `ok: true`
- AgentRuntime smoke:
  - `{"ok":true,"decision":"ready","turns":5}`
- gitleaks: no leaks found

## Release rule

Do not publish unless:

- main HEAD matches intended release target
- CI is green
- local full verification is green
- license readback confirms MIT
- existing v0.1.0 and v0.1.1 are left unchanged
