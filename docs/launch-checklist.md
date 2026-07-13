# QuorumRouter release checklist

Use this checklist for every public release and post-launch update.

## Source and public metadata

- [ ] Work starts from the current protected `main` on a dedicated branch.
- [ ] GitHub repository description matches current product positioning.
- [ ] README, docs, examples, generated templates, release notes, and repository
      metadata contain no obsolete product-stage claims.
- [ ] Historical notes describe old registry values as historical, never
      current.

## Verification

- [ ] `deno task lock:check`
- [ ] `deno task check`
- [ ] `deno task lint`
- [ ] `deno fmt --check`
- [ ] `deno task test`
- [ ] Real SafeLoop E2E runs with a pinned execution-authority commit and
      `SAFELOOP_E2E_REQUIRED=1`.
- [ ] Clean NPX `check` and `smoke` pass.
- [ ] Every provider described as ready completes a real external invocation.
- [ ] Whole-release Red Team returns no unresolved P0/P1/P2.
- [ ] Whole-tree and exact outgoing-diff secret scans pass.

## Publish and readback

- [ ] PR checks pass and all review threads are resolved.
- [ ] PR is merged before tagging.
- [ ] Tag SHA equals the intended protected `main` commit.
- [ ] GitHub Release is published and non-prerelease unless explicitly intended.
- [ ] npm Trusted Publisher workflow succeeds without a long-lived npm token.
- [ ] npm version, `latest`, tarball integrity, provenance subject, workflow,
      source repository, tag, and commit all agree.
- [ ] Tagged source installer defaults to the current release.
- [ ] Clean public NPX generation passes after registry publication.

## Prohibited shortcuts

- Do not count an environment-gated test as executed when it silently returned.
- Do not equate CLI presence with valid OAuth or a successful provider call.
- Do not describe a standalone exported API as runtime-integrated.
- Do not mutate existing tags or npm tarballs.
