# Fusion Modes

## Contract

```ts
type FusionMode = "direct" | "dialogue" | "best_route" | "workflow";
```

These names describe control-plane behavior. They do not grant tool or mutation
authority.

## Implementation status

| Surface                                          | Current status                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| `direct` / existing `best_route`                 | Current production best-answer routing                                 |
| `agent_chat` / existing `AgentRuntime`           | Current experimental explicit opt-in                                   |
| `dialogue` contract                              | Target; not yet a production mode                                      |
| `workflow` contract                              | Target; not yet a production mode                                      |
| target `NativeAgentRuntime`                      | Target contract; distinct from the current experimental `AgentRuntime` |
| LangGraph, AutoGen, CrewAI, CrewAutoGen adapters | Proposed; not yet implemented                                          |

The mode descriptions below define target behavior unless the table marks the
surface as current.

## Direct

A single-model minimal path for summarization, translation, classification,
small explanations, and read-only analysis.

- lowest expected cost and latency;
- no workflow framework;
- no SafeLoop requirement for genuinely read-only work;
- must escalate before executing a mutation.

## Dialogue

A bounded multi-model or multi-role discussion for design choices, comparison,
difficult debugging, review, risk analysis, and high-uncertainty decisions.

Initial implementations may use a native dialogue loop. AutoGen may be selected
when dynamic debate, criticism, delegation, or consensus handling justifies its
overhead.

Dialogue produces proposals or structured decisions. It does not directly
execute mutating tools.

## Workflow

An explicit multi-step execution path for repository changes, long-running
research, plan/implement/test/review flows, database or API operations, artifact
generation, approvals, and scheduled work.

Workflow mode requires a `WorkflowBackend`. Any mutating step must pass through
SafeLoop regardless of backend.

## Best Route

The default user-facing mode. Fusion Router chooses among:

- direct;
- native dialogue;
- NativeAgentRuntime;
- LangGraphBackend;
- AutoGenBackend;
- CrewAIBackend;
- CrewAutoGenBackend.

Target Best Route records the selected mode/backend, accepted features, rejected
alternatives, fallback chain, budgets, and a non-authoritative mutation hint.
SafeLoop independently classifies concrete actions and loads the authoritative
policy version from trusted configuration. It denies or applies the stricter
classification when the router hint disagrees.

## Selection features

```ts
type WorkflowSelectionFeatures = {
  taskComplexity: number;
  requiredDeterminism: number;
  requiredDialogue: number;
  requiredDelegation: number;
  mutationRisk: number;
  expectedDuration: number;
  modelBudget: number;
  frameworkOverheadTolerance: number;
};
```

Provider readiness, auth state, latency, reliability, capability, route
diversity, approval burden, and previous route outcomes may supplement these
features. Optimization must never override safety policy.

## Baseline policy

| Task                                             | Mode              | Preferred backend   |
| ------------------------------------------------ | ----------------- | ------------------- |
| Lightweight question                             | direct            | none                |
| Small comparison                                 | dialogue          | native dialogue     |
| Complex design debate                            | dialogue/workflow | AutoGen             |
| Deterministic multi-step operation               | workflow          | LangGraph           |
| Stable role/task process                         | workflow          | CrewAI              |
| Repository modification                          | workflow          | Native or LangGraph |
| Large structured project requiring expert debate | workflow          | CrewAutoGen         |
| Unclassified task                                | best_route        | router-selected     |

## Explainability record

```json
{
  "selected_backend": "crew_autogen",
  "reason": [
    "high task complexity",
    "multi-role debate required",
    "structured artifact workflow required"
  ],
  "rejected_backends": {
    "direct": "insufficient for multi-step task",
    "autogen": "artifact and process structure required",
    "crewai": "dynamic critic discussion required"
  }
}
```

## Route safety rules

- A mutation task must not remain on an unguarded direct route.
- Fallback may reduce framework complexity but never safety gates.
- Backend nesting and dialogue rounds are bounded.
- Route-collapse detection should flag repeated use of one provider, backend,
  direct route, cheap model, model family, or fallback chain.
- Existing experimental `agent_chat` behavior should be migrated or adapted
  deliberately; it is not silently redefined as production `dialogue` until its
  contract satisfies these rules.
