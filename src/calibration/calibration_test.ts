import { assertEquals, assertThrows } from "@std/assert";
import {
  aggregateTaskCalibration,
  TaskCalibrationObservationSchema,
} from "../../router.ts";

function observation(overrides: Record<string, unknown> = {}) {
  return {
    observation_id: "obs-1",
    task_type: "code_review",
    source: {
      provider: "OpenAI",
      model: "gpt-5",
    },
    evaluation_basis: "external_ground_truth",
    correct: true,
    confidence: 0.8,
    evaluated_at: "2026-07-13T00:00:00Z",
    ...overrides,
  };
}

Deno.test("task calibration rejects invalid and non-ground-truth observations", () => {
  const invalidObservations = [
    observation({ observation_id: "" }),
    observation({ task_type: "   " }),
    observation({ source: { provider: "", model: "gpt-5" } }),
    observation({ source: { provider: "OpenAI", model: "   " } }),
    observation({ evaluation_basis: "decision_report" }),
    observation({ correct: 1 }),
    observation({ confidence: -0.01 }),
    observation({ confidence: 1.01 }),
    observation({ confidence: Number.NaN }),
    observation({ confidence: Number.POSITIVE_INFINITY }),
    observation({ evaluated_at: "yesterday" }),
    observation({ prompt: "secret prompt" }),
    observation({ response: "secret response" }),
    observation({ credentials: "secret" }),
    observation({ notes: "freeform evaluation notes" }),
  ];

  for (const candidate of invalidObservations) {
    assertThrows(() => TaskCalibrationObservationSchema.parse(candidate));
  }
});

Deno.test("task calibration rejects duplicate observation ids", () => {
  assertThrows(
    () =>
      aggregateTaskCalibration([
        observation(),
        observation({
          task_type: "summarization",
          source: { provider: "Anthropic", model: "claude" },
        }),
      ]),
    Error,
    "unique",
  );
});

Deno.test("task calibration separates task types for the same source", () => {
  const result = aggregateTaskCalibration([
    observation({ observation_id: "review", task_type: "code_review" }),
    observation({
      observation_id: "summary",
      task_type: "summarization",
      correct: false,
    }),
  ], { minimum_sample_count: 1 });

  assertEquals(result.groups.length, 2);
  assertEquals(
    result.groups.map((group) => [group.task_type, group.accuracy]),
    [["code_review", 1], ["summarization", 0]],
  );
});

Deno.test("task calibration separates provider/model sources for the same task", () => {
  const result = aggregateTaskCalibration([
    observation({ observation_id: "openai" }),
    observation({
      observation_id: "anthropic",
      source: { provider: "Anthropic", model: "claude" },
      correct: false,
    }),
  ], { minimum_sample_count: 1 });

  assertEquals(result.groups.length, 2);
  assertEquals(
    result.groups.map((group) => [
      group.source.provider,
      group.source.model,
      group.accuracy,
    ]),
    [["Anthropic", "claude", 0], ["OpenAI", "gpt-5", 1]],
  );
});

Deno.test("task calibration computes exact transparent group metrics", () => {
  const result = aggregateTaskCalibration([
    observation({
      observation_id: "correct",
      confidence: 0.8,
      correct: true,
    }),
    observation({
      observation_id: "incorrect",
      confidence: 0.6,
      correct: false,
      evaluated_at: "2026-07-13T00:01:00Z",
    }),
  ], { minimum_sample_count: 2 });

  assertEquals(result, {
    schema_version: "quorum-router.calibration-by-task.v1",
    advisory_only: true,
    minimum_sample_count: 2,
    groups: [{
      task_type: "code_review",
      source: { provider: "OpenAI", model: "gpt-5" },
      sample_count: 2,
      accuracy: 0.5,
      mean_confidence: 0.7,
      brier_score: 0.2,
      calibration_gap: 0.2,
      sample_status: "sufficient",
    }],
  });
});

Deno.test("task calibration defaults to 20 samples and marks small groups insufficient", () => {
  const result = aggregateTaskCalibration([observation()]);

  assertEquals(result.minimum_sample_count, 20);
  assertEquals(result.groups[0].sample_count, 1);
  assertEquals(result.groups[0].sample_status, "insufficient");
  assertEquals("trusted" in result.groups[0], false);
});

Deno.test("task calibration output contains no routing or execution authority", () => {
  const result = aggregateTaskCalibration([observation()], {
    minimum_sample_count: 1,
  });
  const serialized = JSON.stringify(result).toLowerCase();
  const forbidden = [
    "prompt",
    "response",
    "credential",
    "freeform",
    "weight",
    "rank",
    "exclude",
    "execution",
    "authority",
    "statistical_power",
    "representative",
    "routing_fitness",
    "validity",
  ];

  for (const field of forbidden) {
    assertEquals(serialized.includes(field), false, field);
  }
});

Deno.test("task calibration validates minimum sample configuration", () => {
  for (const minimum_sample_count of [0, -1, 1.5, Number.NaN]) {
    assertThrows(() =>
      aggregateTaskCalibration([observation()], { minimum_sample_count })
    );
  }
});
