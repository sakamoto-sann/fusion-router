# SafeLoop Fusion Hierarchical System

## Status

This document freezes the target architecture. It is a design contract, not a
claim that every component is implemented. Existing `best_route`, direct
routing, experimental Agent Chat, and AgentRuntime code remain compatibility
inputs while the contracts below are introduced incrementally.

## Purpose

The system is a general-purpose agent control plane that selects an appropriate
model, interaction mode, workflow structure, and tool route for each task, while
SafeLoop governs every side effect.

```text
User / CLI / Hermes
        |
        v
Fusion Router
  - mode, provider, model, backend, roles
  - fallback, budget, timeout, diversity
  - non-authoritative mutation hints
        |
        v
Workflow Backend (when needed)
  - NativeAgentRuntime
  - LangGraphBackend
  - AutoGenBackend
  - CrewAIBackend
  - CrewAutoGenBackend
        |
        v
SafeLoop Execution Envelope
  - authoritative classify, trusted policy, rollback/compensation readiness
  - approval, audit precommit, watched execution
  - artifact binding, verification, rollback/compensation outcome
  - audit commit, fail-closed halt
        |
        v
Tools / repository / shell / GitHub / database / external API
        |
        v
Local Audit WAL + durable mirrors + run/artifact memory
```

## Authority boundaries

### Fusion Router: decision authority

Fusion Router selects:

- direct, dialogue, best-route, or workflow mode;
- provider and model;
- workflow backend and role composition;
- fallback route;
- model-call, token, dialogue-round, latency, and fallback budgets;
- route diversity constraints;
- a non-authoritative mutation-class hint and anticipated safety requirements.

It cannot authorize execution or select the authoritative policy version.
SafeLoop independently classifies the concrete operation and loads policy from
trusted configuration. A mismatch is resolved toward the stricter classification
or denial.

### SafeLoop: execution authority

SafeLoop owns authoritative classification, trusted-policy selection, and the
allow, deny, approval, evidence, verification, and audit decision for
side-effectful execution. A route selected by Fusion Router must not run when
SafeLoop rejects preflight, approval, policy, audit, capability, or verification
requirements.

### Workflow backends: work structure

A workflow backend structures multi-step work. It must expose a common
descriptor and normalize its result into common run, step, event, and artifact
contracts. A backend must not weaken policy or bypass SafeLoop.

### Storage and observability

- Local append-only Audit WAL is required execution authority.
- Supabase may durably mirror audit and control-plane records but is not the
  sole synchronous authority.
- Supabase/WKDB and optional vector storage provide scoped long-term memory.
- Telemetry is optional and warn-only; audit failures are fatal.

## Sophie and Clawdia

Sophie and Clawdia are role profiles or workflow templates, not machines or
architectural trust boundaries.

```yaml
sophie:
  capabilities: [strategy, planning, delegation, synthesis]
  mutation_access: false

clawdia:
  capabilities: [coding, file_edit, test_execution]
  mutation_access: safeloop_required
```

The names may remain in the UX. Physical host, fixed IP, ZeroMQ, and
deployment-path assumptions must not appear in core contracts.

## Target invocation

```bash
fusion run \
  "Inspect this repository, implement the required fixes, review and red-team them, and prepare the PR" \
  --mode best_route
```

The router records what it selected and why. All mutations are then executed
through the SafeLoop envelope.

## Frozen invariants

1. Fusion Router chooses routes; SafeLoop owns execution authority.
2. Workflow frameworks are replaceable backends, not policy authorities.
3. No backend receives an unwrapped mutating tool.
4. Safety policy is invariant across primary and fallback routes.
5. Audit failure halts; telemetry failure only warns.
6. Policy versions, approvals, route decisions, runs, and artifacts retain
   provenance.
7. Agents cannot self-approve or modify their own policy or credentials.
8. Simple tasks must not pay multi-agent framework overhead without evidence of
   benefit.
