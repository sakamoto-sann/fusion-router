# Memory Model

## Separation of concerns

```text
Active conversation
  = backend-local, short-lived message history

Long-term memory
  = Supabase / WKDB / optional vector store

Artifact memory
  = per-run plans, patches, tests, reviews, and closeout

Policy memory
  = roles, capabilities, policy versions, and approval history
```

Qdrant or another vector store must not become the unbounded message history for
AutoGen. Every backend uses the same provider boundary and receives only
retrieved, policy-eligible context.

## Common interface

```ts
interface MemoryProvider {
  search(query: MemoryQuery): Promise<MemoryItem[]>;
  store(item: MemoryItem): Promise<void>;
  bindToRun(runId: string, itemIds: string[]): Promise<void>;
}
```

Implementations may target Supabase/WKDB or an optional vector adapter. Backend
code depends on this interface, not storage-specific APIs.

## Required metadata

Each memory item includes at least:

- stable identifier and content digest;
- `source` and provenance reference;
- `created_at` and optional expiry/staleness fields;
- `policy_scope`;
- `agent_visibility`;
- confidence;
- `supersedes_id` when replacing older knowledge;
- originating `run_id` when applicable;
- secret/sensitivity classification;
- schema and embedding version when relevant.

## Retrieval and injection

1. The backend submits a purpose- and role-scoped query.
2. MemoryProvider filters by tenant/project, policy, visibility, sensitivity,
   freshness, and provenance.
3. Retrieval ranks a bounded result set.
4. Safe context is injected with source references and confidence.
5. Injected item IDs are bound to the run for reproducibility and audit.

## Prohibitions

- no unbounded injection of complete conversation history;
- no automatic sharing of all memories between agents;
- no automatic injection of secrets or credentials;
- no use of memory without identifiable provenance;
- no treatment of vector similarity as authority or truth;
- no backend-specific hidden memory that bypasses run binding and visibility
  policy.

## Artifact and policy handling

Artifacts retain their run, step, producing backend/model, input references,
digest, validation status, and supersession relationship. Policy records are
versioned control-plane data; agents may read permitted snapshots but cannot
mutate or self-approve them.

## Supabase/WKDB role

The durable control plane may store roles, capability policies, policy versions,
approvals, run indexes, audit mirrors, route decisions and outcomes, workflow
templates and knowledge, failure patterns, memory items, backend versions, runs,
and metrics.

Storage availability does not supersede SafeLoop authority. A memory or
control-plane record is context until validated under the active policy and
bound to the current run.
