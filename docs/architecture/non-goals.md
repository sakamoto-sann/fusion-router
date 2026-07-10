# Non-goals

The first implementation deliberately excludes the following.

## Deployment topology

- Sophie and Clawdia as separate mandatory PCs or services;
- fixed IP addresses or fixed deployment paths;
- a ZeroMQ-centric architecture;
- host identity as an authorization boundary.

Sophie and Clawdia are role profiles or workflow templates inside a
runtime-neutral design.

## Autonomous ecosystems

- external autonomous agents as trusted execution authorities;
- A2A agent swarms;
- unbounded recursive delegation;
- importing the historical hierarchical-system proof of concept wholesale;
- giving AutoGen, CrewAI, LangGraph, or NativeAgentRuntime direct authority to
  mutate.

External-agent adapters may be considered later only behind explicit contracts
and the same SafeLoop envelope.

## Trading and payments

- trading, liquidity provision, order execution, or HFT latency requirements;
- payment-first implementation;
- production on-chain settlement in the core milestones.

Payment/x402 work is future scope and must use spend policy, authorization,
receipts, and compensation rather than pretending irreversible settlement can be
rolled back.

## Unsafe control-plane behavior

- agent self-approval;
- agents changing their own capability policy;
- agent-driven credential changes;
- weakening safety gates during fallback;
- treating workflow output, dialogue consensus, or approval suggestions as
  executable authority;
- making Supabase the only synchronous audit authority;
- treating telemetry as authoritative audit evidence.

## Framework overuse

- using AutoGen or CrewAI for every task;
- selecting CrewAutoGen for simple work;
- assuming multi-agent processing is inherently more accurate or efficient;
- advertising throughput, efficiency, or GPU-utilization gains before
  reproducible benchmarks.

Direct and native routes remain first-class. Framework overhead must be
justified by task features and measured outcomes.

## Initial storage scope

- unbounded message-history ingestion into Qdrant or another vector store;
- global memory visibility across all roles and runs;
- automatic secret injection;
- provenance-free memory;
- optimization that can overwrite policy.

## Milestone ordering

The architecture permits later scheduler, shared-memory, backend-learning,
MCP/skill registry, external API, and payment adapters. Architecture Freeze does
not implement or claim readiness for those systems; it fixes the boundaries they
must obey.
