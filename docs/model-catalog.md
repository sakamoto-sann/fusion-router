# Model catalog, configuration, and live probes

QuorumRouter does not treat wrapper presence as proof that a model is usable.
The model catalog merges four provenance sources:

1. successful explicit probes (`verified_cache`),
2. provider catalog output (`provider_catalog`),
3. operator configuration (`explicit_config`), and
4. versioned, unverified names (`versioned_hint`).

Precedence is `verified` → `listed` → `configured` → `hinted`. A verified record
older than 30 days is `stale` and should be probed again.

## Commands

```bash
quorum-router models list
quorum-router models list --json
quorum-router models add codex gpt-5.4-mini
quorum-router models probe codex gpt-5.4-mini
quorum-router doctor
```

`list`, `add`, and `doctor` do not generate model output. `probe` is an explicit
live provider call. It sends a fixed, non-secret sentinel prompt and writes a
cache record only when the wrapper exits successfully and returns the exact
sentinel.

A provider-only probe uses configured, provider-listed, or previously verified
models. It does not automatically call every versioned hint:

```bash
quorum-router models probe grok
```

If a provider has only hints, specify the model explicitly.

## Persistent files

Default paths:

```text
~/.config/quorum-router/models.json
~/.config/quorum-router/verified-models.json
```

Both files are atomically replaced and mode `0600` on POSIX systems.
Verified-cache v3 binds each record to the resolved wrapper executable path and
its SHA-256 fingerprint. Legacy v1/v2 records are treated as unverified and must
be probed again. The cache is local advisory readiness metadata, not execution
authorization, policy, or a security receipt; re-run a probe when current
availability matters. Override the paths for CI or isolated testing with:

```bash
QUORUM_ROUTER_MODEL_CONFIG=/tmp/models.json
QUORUM_ROUTER_VERIFIED_MODEL_CACHE=/tmp/verified-models.json
```

The verified cache stores only provider, wrapper, resolved wrapper path, wrapper
SHA-256 fingerprint, model, auth mode, and verification timestamp. It does not
store prompts, answers, API keys, OAuth tokens, credential contents, or raw
provider errors.

## Status meanings

| Status            | Meaning                                               |
| ----------------- | ----------------------------------------------------- |
| `verified`        | Exact sentinel generation succeeded within 30 days    |
| `stale`           | A prior verified record is older than 30 days         |
| `listed`          | Returned by a provider-owned catalog command          |
| `configured`      | Explicitly selected by the operator but not verified  |
| `hinted`          | Versioned candidate name; availability is not claimed |
| `not_exposed`     | Wrapper exists but exposes no safe catalog command    |
| `wrapper_missing` | Wrapper executable is absent                          |

Doctor reports catalog provenance separately from wrapper/auth state. Provider
credentials remain provider-owned and are never opened or printed. Probe errors
are redacted and are not persisted in the verified cache.

## Versioned hints

The JSON report exposes the hint catalog schema version, catalog version, and
update timestamp. Hints bootstrap providers whose CLIs accept `--model` but
cannot enumerate the account-specific catalog. Hints are deliberately marked
unverified. A name can be removed or rejected by a provider at any time; only a
successful explicit probe upgrades it to `verified`.
