# Workflow Backends

## Implementation status

All five sections define target backend contracts. The repository currently has
an experimental explicit-opt-in `AgentRuntime`; it is not yet the target
`NativeAgentRuntime` described here. LangGraph, AutoGen, CrewAI, and CrewAutoGen
adapters are proposed and unimplemented at Architecture Freeze.

## Common interface

```ts
interface WorkflowBackend {
  descriptor: WorkflowDescriptor;

  run(
    input: WorkflowInput,
    signal: AbortSignal,
  ): Promise<WorkflowResult>;
}
```

The registry must accept descriptors before implementations exist, allowing
Fusion Router to compare declared capabilities without coupling policy to a
framework.

A descriptor should expose cost, latency, determinism, dialogue, delegation,
checkpoint, nesting, and mutation-proxy capabilities, plus implementation and
framework versions.

## NativeAgentRuntime

Default workflow candidate with the fewest dependencies and most direct SafeLoop
integration.

```text
planner -> coder -> tests -> reviewer -> red_team -> fix -> closeout
```

Use for coding, review/red-team/closeout, explicit reproducible steps, and work
where framework overhead is unjustified. Reviewer and red-team roles are
read-only; coder mutations require SafeLoop; closeout cannot succeed before
required review gates finish.

## LangGraphBackend

Use for deterministic state graphs, conditional edges, retries, checkpoints,
resume, and human-in-the-loop transitions.

The useful graph concepts from `hierarchical-system/sophie_graph.py` are
strategist, planner, architect, quality roles, and edge design. Fixed
Sophie/Clawdia machines, IPs, deployment paths, and ZeroMQ-centric transport are
rejected.

State must normalize into common `WorkflowResult` and artifacts must bind to the
parent run. Mutation nodes receive only SafeLoop-proxied tools.

## AutoGenBackend

Use for bounded agent discussion, criticism, delegation, consensus, strategy
planning, route comparison, and answer refinement.

Example team:

```text
GroupChat Manager
  - Strategist
  - Planner
  - Architect
  - Critic
  - Safety Reviewer
```

Termination includes approved structured result, consensus threshold, maximum
rounds, exhausted budget, timeout, abort, or SafeLoop policy escalation.

AutoGen receives read-only context and proposal tools. It must emit structured
output instead of treating the complete transcript as `WorkflowResult`, and it
never receives direct repo, shell, GitHub, database, or external-write
authority.

## CrewAIBackend

Use for stable, human-editable role/task/process workflows, recurring jobs,
research crews, content processes, and scheduled maintenance.

YAML may define agents, tasks, dependencies, process mode, input/output schemas,
and budgets. Sequential and hierarchical execution must normalize to common
artifacts. Tools come only from a SafeLoop-aware registry.

## CrewAutoGenBackend

A selective hybrid that uses CrewAI for outer task/artifact structure and
AutoGen for bounded discussion inside tasks.

```text
CrewAI
  Strategy Task -> AutoGen debate
  Planning Task -> AutoGen critique
  Implementation Task -> Native execution through SafeLoop
  Review Task -> AutoGen reviewer debate
  Closeout Task -> structured result
```

Select only when complexity, specialist diversity, dynamic critique, artifact
structure, budget, and latency tolerance all justify nested overhead.

Required bounds include maximum nested dialogue sessions, total model calls,
total rounds, total tokens, fallback depth, and backend nesting depth. Inner
failures normalize to task failures and cannot be hidden by the outer framework.

## Baseline fallback

```text
CrewAutoGen -> CrewAI -> NativeAgentRuntime
```

Alternative fallback chains are allowed, but fallback must preserve:

- mutation classification;
- policy version;
- approval requirements;
- SafeLoop verification;
- audit continuity;
- remaining budget and deadline.

## Backend selection evidence

The router records selection features, accepted and rejected backends,
descriptor versions, expected overhead, fallback chain, and safety requirements.
Backend metrics may later include completion and review pass rates, red-team
findings, retries, human intervention, model calls, tokens, latency, artifact
validity, SafeLoop rejections, and backend failures.

Performance claims such as percentage throughput gains, multiplier efficiency,
or GPU utilization remain benchmark hypotheses until measured by reproducible
runs.
