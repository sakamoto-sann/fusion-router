import { assertEquals, assertRejects } from "@std/assert";
import { loadCalibrationEvidence } from "./templates/basic/src/calibration_route.ts";
import { buildTrace } from "./templates/basic/src/trace.ts";

const observation = {
  observation_id: "obs-1",
  task_type: "code-review",
  source: { provider: "Fixture", model: "counting" },
  evaluation_basis: "caller_attested_external_ground_truth",
  correct: true,
  confidence: 0.8,
  evaluated_at: "2026-07-13T00:00:00Z",
} as const;

Deno.test("generated route loader aggregates caller evidence", async () => {
  const path = await Deno.makeTempFile({ suffix: ".json" });
  try {
    await Deno.writeTextFile(
      path,
      JSON.stringify({
        observations: [observation],
        options: { minimum_sample_count: 2 },
      }),
    );
    const report = await loadCalibrationEvidence(path);
    assertEquals(report?.advisory_only, true);
    assertEquals(report?.groups[0].task_type, "code-review");
    assertEquals(report?.groups[0].sample_status, "insufficient");
  } finally {
    await Deno.remove(path).catch(() => undefined);
  }
});

Deno.test("generated route loader rejects duplicate evidence", async () => {
  const path = await Deno.makeTempFile({ suffix: ".json" });
  try {
    await Deno.writeTextFile(
      path,
      JSON.stringify({
        observations: [observation, observation],
      }),
    );
    await assertRejects(() => loadCalibrationEvidence(path));
  } finally {
    await Deno.remove(path).catch(() => undefined);
  }
});

Deno.test("generated route trace hashes calibration identifiers and preserves metrics", async () => {
  const path = await Deno.makeTempFile({ suffix: ".json" });
  try {
    const privateTask = "customer-private-review";
    const privateProvider = "PrivateProvider";
    await Deno.writeTextFile(
      path,
      JSON.stringify({
        observations: [{
          ...observation,
          task_type: privateTask,
          source: { provider: privateProvider, model: "private-model" },
        }],
      }),
    );
    const report = await loadCalibrationEvidence(path);
    const trace = await buildTrace({
      command: "route:once",
      mode: "route_once",
      authMode: "auto",
      calibration: report,
    });
    const serialized = JSON.stringify(trace);
    assertEquals(serialized.includes(privateTask), false);
    assertEquals(serialized.includes(privateProvider), false);
    assertEquals(trace.calibration?.group_count, 1);
    assertEquals(trace.calibration?.groups[0].task_type_sha256.length, 64);
    assertEquals(trace.calibration?.groups[0].source_sha256.length, 64);
    assertEquals(trace.calibration?.groups[0].brier_score, 0.04);
  } finally {
    await Deno.remove(path).catch(() => undefined);
  }
});
