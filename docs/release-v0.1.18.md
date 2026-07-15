# QuorumRouter v0.1.18

QuorumRouter v0.1.18 adds a measurement-only ensemble quality API for
determining whether model panels are genuinely complementary before any future
routing authority is introduced.

## Added

- `cofailure_matrix` reports per-source accuracy, pairwise co-failure, outcome
  disagreement, conditional rescue rates, and the observed all-model co-failure
  rate β.
- `selection_regret` separates candidate availability from aggregator selection,
  including oracle success, best-single performance, oracle uplift, captured
  uplift, and conditional selection success.
- `minority_reports` preserve dissenting conclusions, evidence identifiers,
  externally evaluated correctness, majority-overturn records, and unresolved
  disagreement.
- `real_diversity_scores` measure conclusion and evidence diversity, observable
  embedding similarity, effective rank, effective vote count, and
  caller-supplied task expertise.
- Research documentation records the primary sources, publication status,
  adopted metric definitions, and evidence limits.

## Safety and compatibility

- The API is advisory-only and is not connected to provider eligibility,
  ranking, routing weights, quorum, invocation count, debate, synthesis, or
  execution.
- Inputs require caller-attested external ground truth and one fixed panel of
  2–16 unique provider/model sources.
- Inputs reject prompts, responses, credentials, free-form notes, hidden
  chain-of-thought, unknown fields, duplicate identities, malformed panels, and
  unbounded nested payloads.
- Missing or undefined metrics remain explicit `null`; they are never fabricated
  as zero.
- Existing direct routing, Agent Chat, AgentRuntime, calibration, and
  decision-report behavior remain unchanged.

## Verification

- Full Deno unit/integration suite and generated scaffold checks
- Deno 2.9.2 typecheck, lint, formatting, lockfile, doctor, and fixture smoke
- Exact outgoing secret scans with gitleaks and the Hermes supplemental scanner
- GitHub Actions Trusted Publishing and fresh public NPX scaffold verification
