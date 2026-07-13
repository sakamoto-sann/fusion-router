# npm Trusted Publishing

`create-quorum-router` is published from GitHub Actions using npm Trusted
Publishing. No long-lived npm token is required or permitted in the release
path.

## Bound identity

- GitHub owner: `sakamoto-sann`
- Repository: `quorum-router`
- Workflow: `.github/workflows/publish.yml`
- npm package: `create-quorum-router`

## Release flow

1. Merge the reviewed release PR into protected `main`.
2. Verify the target version does not already exist on npm or GitHub Releases.
3. Create the immutable `vX.Y.Z` tag at the exact protected-main commit.
4. Publish the GitHub Release from the merged release notes.
5. Let `publish.yml` verify and publish through OIDC.
6. Read back npm metadata, tarball integrity, and SLSA provenance.
7. Confirm provenance binds the package to this repository, workflow, tag, and
   source commit.
8. Generate a clean workspace from the public npm package and run its checks.

## Safety rules

- Never add `NPM_TOKEN`, automation tokens, passwords, or OTPs to the
  repository.
- Never publish from an unmerged branch commit.
- Never move or recreate an existing source tag.
- Never mutate an existing npm tarball.
- Treat an npm/GitHub/version mismatch as a failed release.
- Run secret scans over source, exact outgoing diff, PR text, and release text.
