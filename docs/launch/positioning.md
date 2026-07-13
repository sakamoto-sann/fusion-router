# QuorumRouter product positioning

## Product

QuorumRouter is an MIT-licensed control plane for fail-closed multi-model
routing and bounded agent execution.

> Fail-closed routing and safe execution for AI agents.

It separates four responsibilities:

1. **Provider readiness** — resolve explicit provider/model identities and
   verify the configured auth and transport path.
2. **Routing** — select eligible candidates under capability, readiness, and
   optional budget constraints.
3. **Model coordination** — run direct parallel synthesis, Best Route selection,
   or explicit multi-turn Agent Chat.
4. **Execution authority** — send approved repo/shell actions to SafeLoop, which
   authorizes, executes, records, and verifies them.

## Runtime status

- Direct routing is the production fail-closed answer path.
- Best Route invokes independent model candidates and selects or synthesizes a
  result under explicit policy.
- Agent Chat performs bounded multi-turn conversation across configured real
  model wrappers.
- AgentRuntime is production-capable for the verified local execution slice when
  configured with SafeLoop's machine-readable execution authority, signed
  policy, operator-isolated approval, bounded rounds, and verified receipts.
- Conversation-only Agent Chat does not gain mutation authority and remains an
  explicit opt-in mode.
- Task calibration accepts caller-attested external correctness evidence. It is
  diagnostic unless an explicit routing policy consumes it; it never silently
  authorizes execution.

## What QuorumRouter is not

- It is not a hosted SaaS or central API service.
- It does not use a shared service-role runtime or central Supabase data plane.
- It does not treat CLI presence as proof of valid OAuth.
- It does not turn malformed output, missing quorum, missing approval, or
  missing execution evidence into a permissive fallback.
- It does not claim every registered provider is authenticated in every local
  environment; readiness is measured per provider and model.

## Public quickstart

```bash
npx --yes create-quorum-router@latest my-quorum-router
cd my-quorum-router
deno task check
deno task smoke
```

Fixture smoke verifies the generated scaffold. Live provider readiness and
SafeLoop execution are separate gates and must be exercised before making claims
about a particular environment.

## License

QuorumRouter is open source under the MIT License. Commercial use, modification,
distribution, and production use are permitted.
