# SafeLoop Boundaries

## Definition

SafeLoop is the execution safety envelope. It is not a model adapter, router,
workflow framework, or best-effort telemetry sink.

```text
classify
 -> capability policy check
 -> preflight
 -> rollback/compensation classification and readiness
 -> approval gate
 -> audit precommit
 -> watched execution
 -> artifact binding
 -> verification
 -> rollback or compensation outcome
 -> audit commit
 -> durable mirror
```

SafeLoop wraps existing tool execution before and after the side effect. It does
not need to reimplement every tool.

Router mutation declarations are untrusted hints. SafeLoop independently
classifies the concrete operation, selects the applicable policy from trusted
configuration, and resolves any mismatch toward the stricter class or denial.

Before execution, preflight must classify the operation as reversible,
compensatable, or non-reversible and validate the applicable mechanism. A
non-reversible action requires an explicit policy allowance and approval bound
to that fact; otherwise it is denied. Post-execution stages record whether the
prepared rollback or compensation mechanism was used and its verified outcome.

## Mutation classes

```ts
type MutationClass =
  | "read_only"
  | "local_temp_write"
  | "repo_write"
  | "shell_write"
  | "github_write"
  | "db_write"
  | "external_api_write"
  | "release"
  | "policy_change"
  | "credential_change"
  | "payment_future";
```

| Mutation             | SafeLoop      | Approval baseline                            |
| -------------------- | ------------- | -------------------------------------------- |
| `read_only`          | optional      | no                                           |
| `local_temp_write`   | light         | no                                           |
| `repo_write`         | required      | configurable                                 |
| `shell_write`        | required      | command-dependent                            |
| `github_write`       | required      | explicit or policy-bound delegated authority |
| `db_write`           | required      | explicit or policy-bound delegated authority |
| `external_api_write` | required      | explicit or policy-bound delegated authority |
| `release`            | required      | mandatory                                    |
| `policy_change`      | default block | mandatory                                    |
| `credential_change`  | default block | mandatory                                    |
| `payment_future`     | future        | spend policy                                 |

A concrete policy version may be stricter than this table, never implicitly
weaker.

## Backend-independent enforcement

- AutoGen discusses and proposes; it receives no direct mutating tool.
- CrewAI receives tools only from a SafeLoop-aware registry.
- LangGraph mutation nodes call a SafeLoop proxy.
- NativeAgentRuntime sends coder/executor mutations through the same envelope.
- CrewAutoGen applies the boundary at every nested level and at native
  implementation steps.

No backend or fallback route can bypass SafeLoop.

## Audit authority

### Required

A local append-only Audit WAL records route selection, policy snapshot, approval
references, precommit, prepared compensation/rollback evidence, execution
evidence, artifacts, verification, compensation/rollback outcome, and final
commit.

### Durable mirror

Supabase may mirror committed audit records. Mirror delay or outage must not
turn Supabase into an unverified substitute for the local authority.

### Optional

TelemetrySink records operational measurements. Telemetry failure warns but does
not invalidate otherwise authoritative evidence.

## Fail-closed conditions

Execution halts when:

- audit precommit fails;
- the policy snapshot is missing, invalid, mutable, or mismatched;
- required approval is absent, stale, out of scope, or self-issued;
- a forbidden capability is detected;
- a backend attempts an undeclared mutation;
- rollback/compensation readiness is missing or invalid before execution;
- a non-reversible action lacks explicit policy allowance and bound approval;
- artifact binding or verification fails;
- audit commit fails;
- the prepared rollback or compensation outcome cannot be verified.

## Minimal client boundary

```ts
interface SafeLoopClient {
  preflight(request: SafeLoopRequest): Promise<SafeLoopPreflight>;
  watchRun(request: SafeLoopRunRequest): Promise<SafeLoopRunResult>;
  verify(runRef: string): Promise<SafeLoopVerification>;
}
```

A no-op/fake implementation is acceptable only for contract development and
tests. It must be explicit, must not represent production mutation authority,
and must fail closed whenever active policy requires a real verified SafeLoop
run.

## Approval rules

- Agents cannot approve their own requests.
- Approval is bound to actor, policy version, mutation class, scope, expiry, and
  intended action digest.
- Re-routing or fallback does not carry approval to a materially different
  action without revalidation.
- Policy and credential changes are blocked by default and require mandatory
  external approval.

## Proposal versus authority

Plans, reviews, debate transcripts, approval suggestions, and workflow artifacts
are evidence or proposals. They are not executable authority. Only a valid
policy decision plus required approval and committed SafeLoop evidence may
authorize the side effect.
