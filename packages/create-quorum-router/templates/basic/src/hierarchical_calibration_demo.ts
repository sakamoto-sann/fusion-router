import {
  aggregateHierarchicalTaskCalibration,
  resolveHierarchicalTaskCalibration,
} from "./calibration.ts";

const evaluated_at = "2026-07-14T00:00:00Z";
const source = { provider: "OpenAI", model: "example-model" } as const;
const observations = [
  {
    observation_id: "hierarchy-demo-pattern-1",
    task_type: "code-review",
    task_subtype: "typescript",
    prompt_pattern: "schema-boundary-review",
    source,
    evaluation_basis: "caller_attested_external_ground_truth",
    correct: true,
    confidence: 0.9,
    evaluated_at,
  },
  {
    observation_id: "hierarchy-demo-pattern-2",
    task_type: "code-review",
    task_subtype: "typescript",
    prompt_pattern: "schema-boundary-review",
    source,
    evaluation_basis: "caller_attested_external_ground_truth",
    correct: true,
    confidence: 0.8,
    evaluated_at,
  },
  {
    observation_id: "hierarchy-demo-pattern-3",
    task_type: "code-review",
    task_subtype: "typescript",
    prompt_pattern: "schema-boundary-review",
    source,
    evaluation_basis: "caller_attested_external_ground_truth",
    correct: false,
    confidence: 0.7,
    evaluated_at,
  },
  {
    observation_id: "hierarchy-demo-subtype-1",
    task_type: "code-review",
    task_subtype: "typescript",
    prompt_pattern: "concurrency-review",
    source,
    evaluation_basis: "caller_attested_external_ground_truth",
    correct: true,
    confidence: 0.8,
    evaluated_at,
  },
  {
    observation_id: "hierarchy-demo-parent-1",
    task_type: "code-review",
    task_subtype: "rust",
    prompt_pattern: "unsafe-boundary-review",
    source,
    evaluation_basis: "caller_attested_external_ground_truth",
    correct: true,
    confidence: 0.7,
    evaluated_at,
  },
  {
    observation_id: "hierarchy-demo-foreign-1",
    task_type: "code-review",
    task_subtype: "typescript",
    prompt_pattern: "schema-boundary-review",
    source: { provider: "Anthropic", model: "example-model" },
    evaluation_basis: "caller_attested_external_ground_truth",
    correct: true,
    confidence: 0.75,
    evaluated_at,
  },
];

const report = aggregateHierarchicalTaskCalibration(observations, {
  minimum_sample_count: 3,
});
const scenarios = [
  {
    name: "pattern-sufficient",
    query: {
      task_type: "code-review",
      task_subtype: "typescript",
      prompt_pattern: "schema-boundary-review",
      source,
    },
  },
  {
    name: "fallback-to-subtype",
    query: {
      task_type: "code-review",
      task_subtype: "typescript",
      prompt_pattern: "concurrency-review",
      source,
    },
  },
  {
    name: "fallback-to-task",
    query: {
      task_type: "code-review",
      task_subtype: "rust",
      prompt_pattern: "unsafe-boundary-review",
      source,
    },
  },
].map(({ name, query }) => {
  const selection = resolveHierarchicalTaskCalibration(report, query);
  return {
    name,
    query,
    candidates: selection.candidates,
    resolution_status: selection.resolution_status,
    selected_scope: selection.selected_scope,
    selected_sample_count: selection.selected_group?.sample_count ?? null,
  };
});

console.log(JSON.stringify(
  {
    schema_version: "quorum-router.hierarchical-demo.v1",
    advisory_only: true,
    provider_request_sent: false,
    fallback_order: ["prompt_pattern", "task_subtype", "task_type"],
    minimum_sample_count: report.minimum_sample_count,
    observation_count: observations.length,
    scenarios,
  },
  null,
  2,
));
